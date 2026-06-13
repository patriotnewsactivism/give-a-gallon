// Give a Gallon — Stripe Connect Express onboarding
import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ── helpers ────────────────────────────────────────────────────────────────

function stripeHeaders(key: string) {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

async function stripePost(path: string, key: string, params: Record<string, string>) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: stripeHeaders(key),
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe ${path} error: ${err}`);
  }
  return res.json();
}

async function stripeGet(path: string, key: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe ${path} error: ${err}`);
  }
  return res.json();
}

// ── public actions ─────────────────────────────────────────────────────────

/**
 * Start (or resume) Stripe Connect Express onboarding for the current creator.
 * Returns a one-time Stripe Account Link URL to redirect to.
 */
export const startOnboarding = action({
  args: {},
  handler: async (ctx, _args): Promise<{ url: string }> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const creator: any = await ctx.runQuery(internal.connect.getMyCreator);
    if (!creator) throw new Error("Creator profile not found");

    const siteUrl = process.env.SITE_URL || "https://give-a-gallon.vercel.app";

    // Create a Connect Express account if we don't have one yet
    let accountId = creator.stripeAccountId;
    if (!accountId) {
      const account = await stripePost("/accounts", stripeKey, {
        type: "express",
        "capabilities[transfers][requested]": "true",
        "capabilities[card_payments][requested]": "true",
        "settings[payouts][schedule][interval]": "manual", // creator controls payouts
      });
      accountId = account.id;
      await ctx.runMutation(internal.connect.setStripeAccount, {
        creatorId: creator._id,
        stripeAccountId: accountId,
        stripeAccountStatus: "pending",
      });
    }

    // Create a fresh Account Link (they expire quickly)
    const link = await stripePost("/account_links", stripeKey, {
      account: accountId,
      refresh_url: `${siteUrl}/dashboard?connect=refresh`,
      return_url: `${siteUrl}/dashboard?connect=complete`,
      type: "account_onboarding",
    });

    return { url: link.url };
  },
});

/**
 * Trigger an Instant Payout for the creator (to their debit card on file).
 * Stripe charges ~1% for instant payouts.
 */
export const requestPayout = action({
  args: {
    amountCents: v.number(), // amount to pay out
    instant: v.boolean(),    // true = instant (~30 min), false = standard (next day)
  },
  handler: async (ctx, { amountCents, instant }): Promise<{ payoutId: string }> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    const creator: any = await ctx.runQuery(internal.connect.getMyCreator);
    if (!creator) throw new Error("Creator profile not found");
    if (!creator.stripeAccountId) throw new Error("Connect account not set up yet");
    if (creator.stripeAccountStatus !== "active") {
      throw new Error("Stripe account is not fully verified yet");
    }
    if (amountCents < 100) throw new Error("Minimum payout is $1.00");

    const params: Record<string, string> = {
      amount: String(amountCents),
      currency: "usd",
    };
    if (instant) {
      params.method = "instant";
    }

    const payout = await stripePost("/payouts", stripeKey, params);

    // Note: this fetch is authenticated as the connected account via the
    // Stripe-Account header set below — we call the raw fetch ourselves
    const payoutRes = await fetch("https://api.stripe.com/v1/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Stripe-Account": creator.stripeAccountId,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!payoutRes.ok) {
      const err = await payoutRes.text();
      throw new Error(`Payout failed: ${err}`);
    }

    const payoutData = await payoutRes.json();
    return { payoutId: payoutData.id };
  },
});

/**
 * Fetch the available and pending balance for the creator's connected account.
 */
export const getBalance = action({
  args: {},
  handler: async (ctx, _args): Promise<{
    availableCents: number;
    pendingCents: number;
    accountStatus: string;
  }> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    const creator: any = await ctx.runQuery(internal.connect.getMyCreator);
    if (!creator) throw new Error("Creator profile not found");

    if (!creator.stripeAccountId) {
      return { availableCents: 0, pendingCents: 0, accountStatus: "not_connected" };
    }

    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Stripe-Account": creator.stripeAccountId,
      },
    });
    if (!res.ok) {
      return { availableCents: 0, pendingCents: 0, accountStatus: creator.stripeAccountStatus ?? "unknown" };
    }

    const balance = await res.json();
    const availableCents = (balance.available || [])
      .filter((b: any) => b.currency === "usd")
      .reduce((sum: number, b: any) => sum + b.amount, 0);
    const pendingCents = (balance.pending || [])
      .filter((b: any) => b.currency === "usd")
      .reduce((sum: number, b: any) => sum + b.amount, 0);

    return {
      availableCents,
      pendingCents,
      accountStatus: creator.stripeAccountStatus ?? "unknown",
    };
  },
});

// ── internal mutations / queries ───────────────────────────────────────────

export const getMyCreator = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .unique();
    if (!user) return null;
    return ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", user._id))
      .unique();
  },
});

export const setStripeAccount = internalMutation({
  args: {
    creatorId: v.id("creators"),
    stripeAccountId: v.string(),
    stripeAccountStatus: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("restricted"),
    ),
  },
  handler: async (ctx, { creatorId, stripeAccountId, stripeAccountStatus }) => {
    await ctx.db.patch(creatorId, { stripeAccountId, stripeAccountStatus });
  },
});

export const setAccountStatus = internalMutation({
  args: {
    stripeAccountId: v.string(),
    stripeAccountStatus: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("restricted"),
    ),
  },
  handler: async (ctx, { stripeAccountId, stripeAccountStatus }) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_stripeAccount", q => q.eq("stripeAccountId", stripeAccountId))
      .unique();
    if (creator) {
      await ctx.db.patch(creator._id, { stripeAccountStatus });
    }
  },
});
