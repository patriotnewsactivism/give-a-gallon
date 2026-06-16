/**
 * Automations — scheduled tasks triggered by Base44 Superagent
 */
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Query to fetch recent completed donations with creator details
export const getRecentDonationsForAlert = internalQuery({
  args: { minutesAgo: v.number() },
  handler: async (ctx, args: { minutesAgo: number }) => {
    const cutoffTime = Date.now() - args.minutesAgo * 60 * 1000;

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(100);

    const recent = donations.filter((d) => d.createdAt >= cutoffTime);

    const enriched = await Promise.all(
      recent.map(async (d) => {
        const creator = await ctx.db.get(d.creatorId);
        return {
          _id: d._id,
          gallons: d.gallons,
          amountCents: d.amountCents,
          donorName: d.isAnonymous ? "Anonymous" : (d.donorName || "Someone"),
          donorEmail: d.donorEmail || "",
          message: d.message || "",
          createdAt: d.createdAt,
          creatorSlug: creator?.slug ?? "",
          creatorName: creator?.displayName ?? "",
        };
      })
    );

    return enriched;
  },
});

// Query to fetch recent creators for alert
export const getRecentCreatorsForAlert = internalQuery({
  args: { minutesAgo: v.number() },
  handler: async (ctx, args: { minutesAgo: number }) => {
    const cutoffTime = Date.now() - args.minutesAgo * 60 * 1000;

    const creators = await ctx.db
      .query("creators")
      .order("desc")
      .take(100);

    const recent = creators.filter((c) => (c.createdAt ?? 0) >= cutoffTime);

    // Look up user email via userId — creators don't store email directly
    const enriched = await Promise.all(
      recent.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          _id: c._id,
          displayName: c.displayName,
          slug: c.slug,
          category: c.category || "General",
          createdAt: c.createdAt,
          userEmail: user?.email ?? null,
        };
      })
    );

    return enriched;
  },
});
