/**
 * give-a-gallon — Stripe subscription (recurring membership) backend
 *
 * Flow:
 *   1. Frontend calls createSubscriptionCheckout → gets a Stripe Checkout URL
 *   2. Stripe redirects to /donation-success?subscription=1 on payment
 *   3. Stripe webhook (invoice.paid / customer.subscription.*) → http.ts → here
 *   4. Frontend can call cancelSubscription to cancel at period end
 */
import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

// Tier config — keep in sync with MembershipPage.tsx TIERS
const TIER_CONFIG: Record<string, { name: string; amountCents: number; gallons: number }> = {
  "fuel-supporter":    { name: "Fuel Supporter",    amountCents: 500,  gallons: 1  },
  "community-builder": { name: "Community Builder",  amountCents: 1500, gallons: 3  },
  "freedom-partner":   { name: "Freedom Partner",    amountCents: 3000, gallons: 7  },
  "impact-champion":   { name: "Impact Champion",    amountCents: 7500, gallons: 17 },
};

// ── Create Stripe Checkout for a subscription ─────────────────────────────────

export const createSubscriptionCheckout = action({
  args: {
    tierId: v.string(),
    donorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to subscribe");

    const tier = TIER_CONFIG[args.tierId];
    if (!tier) throw new Error("Invalid tier");

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    const siteUrl = process.env.SITE_URL || "https://give.wtpnews.org";

    // Get or create Stripe price for this tier
    const priceId = await ctx.runAction(internal.subscriptions.getOrCreateStripePriceId, {
      tierId: args.tierId,
      amountCents: tier.amountCents,
      tierName: tier.name,
    });

    // Get user email
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email;

    // Check if user already has an active subscription
    const existing = await ctx.runQuery(internal.subscriptions.getActiveSubForUser, { userId });
    if (existing) throw new Error("You already have an active subscription");

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("success_url", `${siteUrl}/donation-success?subscription=1&session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${siteUrl}/membership`);
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[userId]", userId);
    params.append("metadata[tierId]", args.tierId);
    params.append("metadata[tierName]", tier.name);
    params.append("metadata[gallonsPerMonth]", String(tier.gallons));
    params.append("metadata[donorName]", args.donorName ?? "");
    if (email) params.append("customer_email", email);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Stripe subscription error:", err);
      throw new Error("Failed to create subscription checkout");
    }

    const session = await res.json();
    return { url: session.url as string, sessionId: session.id as string };
  },
});

// ── Get or create a recurring Stripe Price for a tier ─────────────────────────

export const getOrCreateStripePriceId = internalAction({
  args: {
    tierId: v.string(),
    amountCents: v.number(),
    tierName: v.string(),
  },
  handler: async (_ctx, args) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    // Search for existing price by lookup_key
    const lookupKey = `gag_sub_${args.tierId}`;
    const searchRes = await fetch(
      `https://api.stripe.com/v1/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true`,
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    const searchData = await searchRes.json();
    if (searchData.data && searchData.data.length > 0) {
      return searchData.data[0].id as string;
    }

    // Create product + price
    const productParams = new URLSearchParams();
    productParams.append("name", `Give-A-Gallon: ${args.tierName}`);
    productParams.append("description", `Monthly membership — ${TIER_CONFIG[args.tierId]?.gallons ?? "?"} gallons/month`);
    productParams.append("metadata[tierId]", args.tierId);

    const productRes = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: productParams.toString(),
    });
    const product = await productRes.json();

    const priceParams = new URLSearchParams();
    priceParams.append("product", product.id);
    priceParams.append("unit_amount", String(args.amountCents));
    priceParams.append("currency", "usd");
    priceParams.append("recurring[interval]", "month");
    priceParams.append("lookup_key", lookupKey);
    priceParams.append("transfer_lookup_key", "true");
    priceParams.append("metadata[tierId]", args.tierId);

    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: priceParams.toString(),
    });
    const price = await priceRes.json();
    return price.id as string;
  },
});

// ── Cancel subscription (end of period) ──────────────────────────────────────

export const cancelSubscription = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.runQuery(internal.subscriptions.getActiveSubForUser, { userId });
    if (!sub) throw new Error("No active subscription found");
    if (!sub.stripeSubscriptionId) throw new Error("No Stripe subscription ID on record");

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe not configured");

    // Cancel at period end
    const params = new URLSearchParams();
    params.append("cancel_at_period_end", "true");

    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripeSubscriptionId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to cancel subscription: ${err}`);
    }

    await ctx.runMutation(internal.subscriptions.updateSubStatus, {
      stripeSubscriptionId: sub.stripeSubscriptionId,
      status: "canceled",
      canceledAt: Date.now(),
    });

    // Send cancelation email
    if (sub.donorEmail) {
      await ctx.runAction(internal.emails.sendSubscriptionCanceled, {
        donorEmail: sub.donorEmail,
        donorName: sub.donorName ?? "there",
        tierName: sub.tierName,
        currentPeriodEndMs: sub.currentPeriodEnd ?? Date.now(),
      });
    }

    return { success: true };
  },
});

// ── Queries (public / auth-gated) ─────────────────────────────────────────────

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return ctx.db
      .query("subscriptions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();
  },
});

export const getSubscriptionStats = query({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", q => q.eq("status", "active"))
      .collect();

    const totalMonthlyRevenueCents = subs.reduce((s, sub) => s + sub.amountCents, 0);
    const totalGallonsPerMonth = subs.reduce((s, sub) => s + sub.gallonsPerMonth, 0);

    const byTier = subs.reduce<Record<string, number>>((acc, sub) => {
      acc[sub.tierId] = (acc[sub.tierId] ?? 0) + 1;
      return acc;
    }, {});

    return {
      activeCount: subs.length,
      totalMonthlyRevenueCents,
      totalGallonsPerMonth,
      byTier,
    };
  },
});

// ── Internal mutations (called from webhook handler) ─────────────────────────

export const getActiveSubForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();
  },
});

export const getSubByStripeId = internalQuery({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, { stripeSubscriptionId }) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscription", q => q.eq("stripeSubscriptionId", stripeSubscriptionId))
      .first();
  },
});

export const createSubscriptionRecord = internalMutation({
  args: {
    userId: v.id("users"),
    donorEmail: v.string(),
    donorName: v.optional(v.string()),
    tierId: v.string(),
    tierName: v.string(),
    amountCents: v.number(),
    gallonsPerMonth: v.number(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deactivate any old subscriptions for this user
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
    for (const sub of existing) {
      if (sub.status === "active") {
        await ctx.db.patch(sub._id, { status: "canceled", updatedAt: now });
      }
    }

    return ctx.db.insert("subscriptions", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSubStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(v.literal("active"), v.literal("canceled"), v.literal("past_due"), v.literal("paused")),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscription", q => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .first();

    if (!sub) return;

    await ctx.db.patch(sub._id, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.currentPeriodEnd ? { currentPeriodEnd: args.currentPeriodEnd } : {}),
      ...(args.canceledAt ? { canceledAt: args.canceledAt } : {}),
    });
  },
});
