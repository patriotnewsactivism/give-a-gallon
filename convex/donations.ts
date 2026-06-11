import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const GALLON_PRICE_CENTS = 425; // $4.25
const PLATFORM_FEE_PCT = 0.05; // 5%

// Get recent donations for a creator (public)
export const listForCreator = query({
  args: { creatorId: v.id("creators"), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .order("desc")
      .take(limit ?? 50);

    // Hide emails, show donor names (or "Anonymous")
    return donations.map((d) => ({
      _id: d._id,
      gallons: d.gallons,
      amountCents: d.amountCents,
      donorName: d.isAnonymous ? "Anonymous" : (d.donorName || "Someone"),
      message: d.message,
      isAnonymous: d.isAnonymous,
      createdAt: d.createdAt,
      status: d.status,
    }));
  },
});

// Create a donation (public — no auth required to donate)
export const create = mutation({
  args: {
    creatorId: v.id("creators"),
    gallons: v.number(),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.gallons < 1 || args.gallons > 1000) {
      throw new Error("Gallons must be between 1 and 1000");
    }

    const creator = await ctx.db.get(args.creatorId);
    if (!creator || !creator.isActive) {
      throw new Error("Creator not found or inactive");
    }

    const amountCents = Math.round(args.gallons * GALLON_PRICE_CENTS);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PCT);

    const donationId = await ctx.db.insert("donations", {
      creatorId: args.creatorId,
      gallons: args.gallons,
      amountCents,
      platformFeeCents,
      donorName: args.donorName,
      donorEmail: args.donorEmail,
      message: args.message,
      isAnonymous: args.isAnonymous,
      status: "completed", // For MVP, mark as completed immediately
      createdAt: Date.now(),
    });

    // Update creator totals
    await ctx.db.patch(args.creatorId, {
      totalGallons: creator.totalGallons + args.gallons,
      totalDonations: creator.totalDonations + 1,
      totalAmountCents: creator.totalAmountCents + amountCents,
    });

    return donationId;
  },
});

// Get platform stats (public)
export const platformStats = query({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db.query("creators").collect();
    const activeCreators = creators.filter((c) => c.isActive);
    const totalGallons = creators.reduce((sum, c) => sum + c.totalGallons, 0);
    const totalDonations = creators.reduce(
      (sum, c) => sum + c.totalDonations,
      0
    );

    return {
      totalCreators: activeCreators.length,
      totalGallons,
      totalDonations,
    };
  },
});
