// Give a Gallon — PayPal Connect internal mutations/queries (non-Node runtime)
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery } from "./_generated/server";

export const getMyCreator = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.query("creators").withIndex("by_userId", q => q.eq("userId", userId)).first();
  },
});

export const setPayPalEmail = internalMutation({
  args: { creatorId: v.id("creators"), paypalEmail: v.string() },
  handler: async (ctx, { creatorId, paypalEmail }) => {
    await ctx.db.patch(creatorId, { paypalEmail } as any);
  },
});

export const setStripeAccount = internalMutation({
  args: {
    creatorId: v.id("creators"),
    stripeAccountId: v.string(),
    stripeAccountStatus: v.union(v.literal("pending"), v.literal("active"), v.literal("restricted")),
  },
  handler: async (ctx, { creatorId, stripeAccountId, stripeAccountStatus }) => {
    await ctx.db.patch(creatorId, { stripeAccountId, stripeAccountStatus });
  },
});
