// Give a Gallon — PayPal Connect internal mutations/queries (non-Node runtime)

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getMyCreator = internalQuery({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
  },
});

export const setPayPalEmail = internalMutation({
  args: { creatorId: v.id("creators"), paypalEmail: v.string() },
  handler: async (ctx, { creatorId, paypalEmail }) => {
    await ctx.db.patch(creatorId, {
      paypalEmail,
      stripeAccountId: "paypal_payout",
      stripeAccountStatus: "active",
    });
  },
});

export const recordPayout = internalMutation({
  args: { creatorId: v.id("creators"), amountCents: v.number() },
  handler: async (ctx, { creatorId, amountCents }) => {
    const creator = await ctx.db.get(creatorId);
    if (!creator) throw new Error("Creator not found");
    const currentPayouts = creator.payoutsCents ?? 0;
    await ctx.db.patch(creatorId, {
      payoutsCents: currentPayouts + amountCents,
    });
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
