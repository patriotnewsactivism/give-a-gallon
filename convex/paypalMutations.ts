// Give a Gallon — PayPal internal mutations & queries (non-Node runtime)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { PLATFORM_FEE_PCT } from "./constants";

export const createPendingDonation = internalMutation({
  args: {
    creatorId: v.id("creators"),
    gallons: v.number(),
    amountCents: v.number(),
    platformFeeCents: v.number(),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("donations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    }),
});

export const setPayPalOrderId = internalMutation({
  args: { donationId: v.id("donations"), paypalOrderId: v.string() },
  handler: async (ctx, { donationId, paypalOrderId }) =>
    ctx.db.patch(donationId, { stripeSessionId: paypalOrderId }),
});

export const getByPayPalOrder = internalQuery({
  args: { donationId: v.string() },
  handler: async (ctx, { donationId }) => ctx.db.get(donationId as any),
});

export const completeDonation = internalMutation({
  args: { donationId: v.string(), paypalCaptureId: v.optional(v.string()) },
  handler: async (ctx, { donationId, paypalCaptureId }) => {
    const donation = (await ctx.db.get(
      donationId as any,
    )) as Doc<"donations"> | null;
    if (!donation || donation.status === "completed") return;

    await ctx.db.patch(donation._id, {
      status: "completed",
      ...(paypalCaptureId ? { stripePaymentIntentId: paypalCaptureId } : {}),
    });

    const creator = (await ctx.db.get(
      donation.creatorId,
    )) as Doc<"creators"> | null;
    if (creator) {
      await ctx.db.patch(creator._id, {
        totalGallons: creator.totalGallons + donation.gallons,
        totalDonations: creator.totalDonations + 1,
        totalAmountCents: creator.totalAmountCents + donation.amountCents,
      });
    }

    const stats = await ctx.db
      .query("platformStats")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();
    if (stats) {
      await ctx.db.patch(stats._id, {
        totalDonationsCents: stats.totalDonationsCents + donation.amountCents,
        totalGallons: stats.totalGallons + donation.gallons,
        totalDonors: stats.totalDonors + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("platformStats", {
        key: "global",
        totalDonationsCents: donation.amountCents,
        totalGallons: donation.gallons,
        totalDonors: 1,
        totalCreators: 1,
        totalCampaigns: 1,
        successfulCampaigns: 1,
        updatedAt: Date.now(),
      });
    }

    if (donation.referralCode) {
      await ctx.runMutation(internal.referrals.creditReferral, {
        referralCode: donation.referralCode,
        gallons: donation.gallons,
        donationId: donation._id,
      });
    }
  },
});

export const getEligibleCreatorsForPayout = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    Array<{
      _id: string;
      paypalEmail: string;
      totalAmountCents: number;
      payoutsCents: number;
    }>
  > => {
    const MIN_PAYOUT_CENTS = 500;
    const creators = await ctx.db.query("creators").collect();

    return creators
      .filter((c) => {
        if (!c.paypalEmail || !c.isActive) return false;
        const owed =
          c.totalAmountCents * (1 - PLATFORM_FEE_PCT) - (c.payoutsCents ?? 0);
        return owed >= MIN_PAYOUT_CENTS;
      })
      .map((c) => ({
        _id: c._id,
        paypalEmail: c.paypalEmail!,
        totalAmountCents: c.totalAmountCents,
        payoutsCents: c.payoutsCents ?? 0,
      }));
  },
});

export const updatePayoutsCents = internalMutation({
  args: {
    creatorId: v.id("creators"),
    payoutAmountCents: v.number(),
  },
  handler: async (ctx, { creatorId, payoutAmountCents }) => {
    const creator = await ctx.db.get(creatorId);
    if (!creator) throw new Error("Creator not found");

    const currentPayoutsCents = creator.payoutsCents ?? 0;

    await ctx.db.patch(creatorId, {
      payoutsCents: currentPayoutsCents + payoutAmountCents,
    });
  },
});
