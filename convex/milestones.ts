import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listForCreator = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    return ctx.db
      .query("milestones")
      .withIndex("by_creator", q => q.eq("creatorId", creatorId))
      .order("asc")
      .collect();
  },
});

export const upsert = mutation({
  args: {
    milestoneId: v.optional(v.id("milestones")),
    title: v.string(),
    description: v.optional(v.string()),
    targetCents: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
    if (!creator) throw new Error("Creator profile not found");

    if (args.milestoneId) {
      await ctx.db.patch(args.milestoneId, {
        title: args.title,
        description: args.description,
        targetCents: args.targetCents,
        order: args.order,
      });
      return args.milestoneId;
    }
    return ctx.db.insert("milestones", {
      creatorId: creator._id,
      title: args.title,
      description: args.description,
      targetCents: args.targetCents,
      order: args.order,
      isCompleted: false,
    });
  },
});
