import { query } from "./_generated/server";
import { v } from "convex/values";

export const recentCompleted = query({
  args: { minutesAgo: v.optional(v.number()) },
  handler: async (ctx, { minutesAgo = 10 }) => {
    const cutoffTime = Date.now() - minutesAgo * 60 * 1000;
    
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(100);

    const recent = donations.filter(d => d.createdAt >= cutoffTime);

    const withCreators = await Promise.all(
      recent.map(async (d) => {
        const creator = await ctx.db.get(d.creatorId);
        return {
          _id: d._id,
          gallons: d.gallons,
          amountCents: d.amountCents,
          donorName: d.isAnonymous ? "Anonymous" : (d.donorName || "Someone"),
          message: d.message,
          createdAt: d.createdAt,
          creatorSlug: creator?.slug ?? "",
          creatorName: creator?.displayName ?? "",
        };
      })
    );

    return withCreators;
  },
});
