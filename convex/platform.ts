import { internalMutation, query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async ctx => {
    const stats = await ctx.db
      .query("platformStats")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (stats) return stats;

    // Fallback: compute live if not materialized yet
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", q => q.eq("status", "completed"))
      .collect();

    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    const totalDonationsCents = donations.reduce(
      (s, d) => s + d.amountCents,
      0,
    );
    const totalGallons = donations.reduce((s, d) => s + d.gallons, 0);
    const uniqueDonors = new Set(
      donations.map(d => d.donorEmail).filter(Boolean),
    ).size;

    return {
      totalDonationsCents,
      totalGallons,
      totalDonors: uniqueDonors,
      totalCreators: creators.length,
      totalCampaigns: creators.length,
      successfulCampaigns: creators.filter(c => c.totalGallons > 0).length,
      updatedAt: Date.now(),
    };
  },
});

export const recompute = internalMutation({
  args: {},
  handler: async ctx => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", q => q.eq("status", "completed"))
      .collect();

    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    const totalDonationsCents = donations.reduce(
      (s, d) => s + d.amountCents,
      0,
    );
    const totalGallons = donations.reduce((s, d) => s + d.gallons, 0);
    const uniqueDonors = new Set(
      donations.map(d => d.donorEmail).filter(Boolean),
    ).size;

    const existing = await ctx.db
      .query("platformStats")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    const data = {
      key: "global" as const,
      totalDonationsCents,
      totalGallons,
      totalDonors: uniqueDonors,
      totalCreators: creators.length,
      totalCampaigns: creators.length,
      successfulCampaigns: creators.filter(c => c.totalGallons > 0).length,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("platformStats", data);
    }
  },
});
