/**
 * Donation Matching Engine
 * Sponsors can create matching campaigns that double (or triple) donations
 * dollar-for-dollar up to a cap. When a donation comes in during an active
 * match campaign, a matching contribution is automatically added.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { GALLON_PRICE_CENTS } from "./constants";

// ─── Create a matching campaign (sponsor or admin) ──────────────
export const createMatchCampaign = mutation({
  args: {
    creatorId: v.id("creators"),
    sponsorName: v.string(),
    sponsorMessage: v.optional(v.string()),
    matchRatio: v.number(),       // e.g., 2.0 = double, 3.0 = triple
    maxMatchGallons: v.number(),  // cap on total matched gallons
    startsAt: v.number(),         // timestamp
    endsAt: v.number(),           // timestamp
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.startsAt >= args.endsAt) throw new Error("start must be before end");
    if (args.matchRatio < 1 || args.matchRatio > 10) throw new Error("matchRatio must be 1-10");
    if (args.maxMatchGallons < 1) throw new Error("maxMatchGallons must be >= 1");

    return await ctx.db.insert("matchCampaigns", {
      creatorId: args.creatorId,
      sponsorName: args.sponsorName,
      sponsorMessage: args.sponsorMessage,
      matchRatio: args.matchRatio,
      maxMatchGallons: args.maxMatchGallons,
      matchedGallons: 0,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      isActive: true,
      createdAt: now,
    });
  },
});

// ─── Get active match campaign for a creator ────────────────────
export const getActiveMatch = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    const now = Date.now();
    const campaigns = await ctx.db
      .query("matchCampaigns")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("startsAt"), now),
          q.gt(q.field("endsAt"), now),
        )
      )
      .first();
    return campaigns || null;
  },
});

// ─── List all match campaigns for a creator ─────────────────────
export const listCampaigns = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    return await ctx.db
      .query("matchCampaigns")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .order("desc")
      .take(20);
  },
});

// ─── Apply match to a donation (called after donation completes) ─
export const applyMatch = internalMutation({
  args: {
    creatorId: v.id("creators"),
    donationGallons: v.number(),
    donationId: v.id("donations"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find active match campaign
    const campaign = await ctx.db
      .query("matchCampaigns")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("startsAt"), now),
          q.gt(q.field("endsAt"), now),
        )
      )
      .first();

    if (!campaign) return { matched: false, matchGallons: 0 };

    // Calculate match
    const remaining = campaign.maxMatchGallons - campaign.matchedGallons;
    if (remaining <= 0) {
      // Campaign exhausted — deactivate
      await ctx.db.patch(campaign._id, { isActive: false });
      return { matched: false, matchGallons: 0 };
    }

    const matchGallons = Math.min(
      Math.floor(args.donationGallons * (campaign.matchRatio - 1)),
      remaining,
    );

    if (matchGallons <= 0) return { matched: false, matchGallons: 0 };

    // Create matched donation record
    const matchAmountCents = matchGallons * GALLON_PRICE_CENTS;
    const matchFeeCents = Math.round(matchAmountCents * 0.05); // 5% platform fee

    await ctx.db.insert("donations", {
      creatorId: args.creatorId,
      gallons: matchGallons,
      amountCents: matchAmountCents,
      platformFeeCents: matchFeeCents,
      donorName: `${campaign.sponsorName} (Match)`,
      donorEmail: null,
      message: campaign.sponsorMessage || `Matched ${campaign.matchRatio}x by ${campaign.sponsorName}`,
      isAnonymous: false,
      status: "completed",
      stripeSessionId: `match_${campaign._id}_${Date.now()}`,
      isMatchedDonation: true,
      matchedFromDonationId: args.donationId,
      createdAt: now,
    });

    // Update campaign matched total
    await ctx.db.patch(campaign._id, {
      matchedGallons: campaign.matchedGallons + matchGallons,
    });

    // Update creator totals
    const creator = await ctx.db.get(args.creatorId);
    if (creator) {
      await ctx.db.patch(args.creatorId, {
        totalGallons: (creator.totalGallons || 0) + matchGallons,
        totalDonations: (creator.totalDonations || 0) + 1,
        totalAmountCents: (creator.totalAmountCents || 0) + matchAmountCents,
      });
    }

    // Deactivate if exhausted
    if (campaign.matchedGallons + matchGallons >= campaign.maxMatchGallons) {
      await ctx.db.patch(campaign._id, { isActive: false });
    }

    return { matched: true, matchGallons, campaignId: campaign._id };
  },
});

// ─── Deactivate a match campaign ────────────────────────────────
export const deactivateCampaign = mutation({
  args: { campaignId: v.id("matchCampaigns") },
  handler: async (ctx, { campaignId }) => {
    await ctx.db.patch(campaignId, { isActive: false });
  },
});

// ─── Get match stats for public display ─────────────────────────
export const getMatchStats = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, { creatorId }) => {
    const now = Date.now();
    const active = await ctx.db
      .query("matchCampaigns")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("startsAt"), now),
          q.gt(q.field("endsAt"), now),
        )
      )
      .first();

    if (!active) return null;

    return {
      sponsorName: active.sponsorName,
      sponsorMessage: active.sponsorMessage,
      matchRatio: active.matchRatio,
      maxMatchGallons: active.maxMatchGallons,
      matchedGallons: active.matchedGallons,
      remainingGallons: active.maxMatchGallons - active.matchedGallons,
      endsAt: active.endsAt,
    };
  },
});
