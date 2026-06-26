/**
 * give-a-gallon — PayPal subscription (recurring membership) backend
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

const TIER_CONFIG: Record<
  string,
  { name: string; amountCents: number; gallons: number }
> = {
  "fuel-supporter": { name: "Fuel Supporter", amountCents: 500, gallons: 1 },
  "community-builder": {
    name: "Community Builder",
    amountCents: 1500,
    gallons: 3,
  },
  "freedom-partner": { name: "Freedom Partner", amountCents: 3000, gallons: 7 },
  "impact-champion": {
    name: "Impact Champion",
    amountCents: 7500,
    gallons: 17,
  },
};

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");
  const base =
    process.env.PAYPAL_ENV === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token error: ${await res.text()}`);
  return ((await res.json()) as any).access_token as string;
}

function paypalBase() {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export const createSubscriptionOrder = action({
  args: { tierId: v.string(), donorName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to subscribe");
    const tier = TIER_CONFIG[args.tierId];
    if (!tier) throw new Error("Invalid tier");
    const existing = await ctx.runQuery(
      internal.subscriptions.getActiveSubForUser,
      { userId },
    );
    if (existing) throw new Error("You already have an active subscription");

    const token = await getPayPalToken();
    const siteUrl = process.env.SITE_URL || "https://www.giveagallon.org";
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email ?? "";
    const amountUSD = (tier.amountCents / 100).toFixed(2);
    const planEnvKey = `PAYPAL_PLAN_${args.tierId.toUpperCase().replace(/-/g, "_")}`;
    let planId = process.env[planEnvKey];

    if (!planId) {
      const productRes = await fetch(`${paypalBase()}/v1/catalogs/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Give-A-Gallon: ${tier.name}`,
          type: "SERVICE",
          category: "CHARITY",
        }),
      });
      const product = (await productRes.json()) as any;
      const planRes = await fetch(`${paypalBase()}/v1/billing/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          name: `Give-A-Gallon ${tier.name}`,
          billing_cycles: [
            {
              frequency: { interval_unit: "MONTH", interval_count: 1 },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: { value: amountUSD, currency_code: "USD" },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: { value: "0", currency_code: "USD" },
            payment_failure_threshold: 3,
          },
        }),
      });
      const plan = (await planRes.json()) as any;
      planId = plan.id;
      console.warn(
        `Created PayPal plan ${planId} — set ${planEnvKey}=${planId} in Convex env.`,
      );
    }

    const subRes = await fetch(`${paypalBase()}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          email_address: email,
          name: { given_name: args.donorName ?? "" },
        },
        application_context: {
          brand_name: "Give-A-Gallon",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${siteUrl}/donation-success?subscription=1`,
          cancel_url: `${siteUrl}/membership`,
        },
        custom_id: userId,
      }),
    });
    if (!subRes.ok)
      throw new Error(`PayPal subscription error: ${await subRes.text()}`);
    const sub = (await subRes.json()) as any;
    const approveLink = sub.links?.find((l: any) => l.rel === "approve")?.href;
    if (!approveLink) throw new Error("No PayPal approve link returned");
    return { url: approveLink as string, subscriptionId: sub.id as string };
  },
});

export const cancelSubscription = action({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const sub = await ctx.runQuery(internal.subscriptions.getActiveSubForUser, {
      userId,
    });
    if (!sub) throw new Error("No active subscription found");
    if (!sub.stripeSubscriptionId)
      throw new Error("No subscription ID on record");
    const token = await getPayPalToken();
    const res = await fetch(
      `${paypalBase()}/v1/billing/subscriptions/${sub.stripeSubscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Cancelled by subscriber" }),
      },
    );
    if (!res.ok && res.status !== 204)
      throw new Error(`Failed to cancel: ${await res.text()}`);
    await ctx.runMutation(internal.subscriptions.updateSubStatus, {
      stripeSubscriptionId: sub.stripeSubscriptionId,
      status: "canceled",
      canceledAt: Date.now(),
    });
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

export const getMySubscription = query({
  args: {},
  handler: async ctx => {
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
  handler: async ctx => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", q => q.eq("status", "active"))
      .collect();
    return {
      activeCount: subs.length,
      totalMonthlyRevenueCents: subs.reduce((s, sub) => s + sub.amountCents, 0),
      totalGallonsPerMonth: subs.reduce((s, sub) => s + sub.gallonsPerMonth, 0),
      byTier: subs.reduce<Record<string, number>>((acc, sub) => {
        acc[sub.tierId] = (acc[sub.tierId] ?? 0) + 1;
        return acc;
      }, {}),
    };
  },
});

export const getActiveSubForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query("subscriptions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first(),
});

export const getSubByPayPalId = internalQuery({
  args: { paypalSubscriptionId: v.string() },
  handler: async (ctx, { paypalSubscriptionId }) =>
    ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscription", q =>
        q.eq("stripeSubscriptionId", paypalSubscriptionId),
      )
      .first(),
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
    paypalSubscriptionId: v.string(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();
    if (existing)
      await ctx.db.patch(existing._id, {
        status: "canceled",
        canceledAt: now,
        updatedAt: now,
      });
    return ctx.db.insert("subscriptions", {
      userId: args.userId,
      donorEmail: args.donorEmail,
      donorName: args.donorName,
      tierId: args.tierId,
      tierName: args.tierName,
      amountCents: args.amountCents,
      gallonsPerMonth: args.gallonsPerMonth,
      stripeSubscriptionId: args.paypalSubscriptionId,
      status: "active",
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSubStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("paused"),
    ),
    canceledAt: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { stripeSubscriptionId, status, canceledAt, currentPeriodEnd },
  ) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscription", q =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId),
      )
      .first();
    if (!sub) return;
    await ctx.db.patch(sub._id, {
      status,
      ...(canceledAt ? { canceledAt } : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      updatedAt: Date.now(),
    });
  },
});
