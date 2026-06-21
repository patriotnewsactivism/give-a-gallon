// Give a Gallon — Stripe Connect Express onboarding
import { getAuthUserId } from "@convex-dev/auth/server";
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

    const siteUrl = process.env.SITE_URL || "https://www.giveagallon.org";

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
 * Request a payout for the creator.
 * standard = 1-2 business days, no fee.
 * instant   = ~30 min to debit card, Stripe charges ~1% (min $0.50, max $10).
 *             We pass Stripe's fee through transparently — no markup.
 */
export const requestPayout = action({
  args: {
    amountCents: v.number(),
    instant: v.boolean(),
  },
  handler: async (ctx, { amountCents, instant }): Promise<{
    payoutId: string;
    feeCents: number;
    netCents: number;
    method: string;
  }> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    const creator: any = await ctx.runQuery(internal.connect.getMyCreator);
    if (!creator) throw new Error("Creator profile not found");
    if (!creator.stripeAccountId) throw new Error("Connect account not set up yet");
    if (creator.stripeAccountStatus !== "active") {
      throw new Error("Stripe account is not fully verified yet");
    }
    if (amountCents < 100) throw new Error("Minimum payout is $1.00");

    // Calculate Stripe instant payout fee: 1%, min $0.50, max $10.00
    // We pass this through at cost — zero markup.
    let feeCents = 0;
    if (instant) {
      feeCents = Math.round(amountCents * 0.01);
      if (feeCents < 50) feeCents = 50;
      if (feeCents > 1000) feeCents = 1000;
    }
    const netCents = amountCents - feeCents;

    const payoutRes = await fetch("https://api.stripe.com/v1/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Stripe-Account": creator.stripeAccountId,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(amountCents),
        currency: "usd",
        method: instant ? "instant" : "standard",
      }).toString(),
    });

    if (!payoutRes.ok) {
      const err = await payoutRes.text();
      throw new Error(`Payout failed: ${err}`);
    }

    const payoutData = await payoutRes.json();
    return {
      payoutId: payoutData.id,
      feeCents,
      netCents,
      method: instant ? "instant" : "standard",
    };
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
    // Resolve the creator the same way the rest of the app does: by the
    // authenticated user id. The auth identity does not carry a reliable
    // `email` claim, so an email-based lookup here returns null and breaks
    // onboarding/payouts/balance with a spurious "Creator profile not found".
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
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
