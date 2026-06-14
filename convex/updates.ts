import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForCreator = query({
  args: { creatorId: v.id("creators"), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    return ctx.db
      .query("updates")
      .withIndex("by_creator", q => q.eq("creatorId", creatorId))
      .order("desc")
      .take(limit ?? 20);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    impactTag: v.optional(v.string()),
    gallonsUsed: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
    if (!creator) throw new Error("Creator profile not found");

    return ctx.db.insert("updates", {
      creatorId: creator._id,
      title: args.title,
      body: args.body,
      impactTag: args.impactTag,
      gallonsUsed: args.gallonsUsed,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});
