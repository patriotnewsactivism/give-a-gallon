import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GALLON_PRICE_CENTS, PLATFORM_FEE_PERCENTAGE } from "./constants";

export const getLiveTicker = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 50);
    const recent = await ctx.db
      .query("donations")
      .withIndex("by_status_and_created", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(limit);

    const results = [];
    for (const d of recent) {
      const creator = await ctx.db.get(d.creatorId);
      results.push({
        _id: d._id,
        gallons: d.gallons,
        donorName: d.donorName,
        createdAt: d.createdAt,
        creatorSlug: creator?.slug ?? "",
        creatorName: creator?.displayName ?? "Unknown Creator",
      });
    }
    return results;
  },
});

export const recordCompletedCheckoutSession = mutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    creatorSlug: v.string(),
    donorName: v.string(),
    donorEmail: v.optional(v.string()),
    gallons: v.number(),
    amountCents: v.number(),
  },
  handler: async (ctx, args) => {
    // Deduplicate webhook execution to prevent double crediting
    const dedup = await ctx.db
      .query("webhookDeduplications")
      .withIndex("by_eventKey", (q) => q.eq("eventKey", `stripe_session_${args.stripeSessionId}`))
      .first();
    if (dedup) {
      return { duplicate: true };
    }

    await ctx.db.insert("webhookDeduplications", {
      eventKey: `stripe_session_${args.stripeSessionId}`,
      provider: "stripe",
      processedAt: Date.now(),
    });

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.creatorSlug))
      .first();

    if (!creator) {
      throw new Error(`Creator not found with slug: ${args.creatorSlug}`);
    }

    const feeCents = Math.round(args.amountCents * PLATFORM_FEE_PERCENTAGE);
    const netCents = args.amountCents - feeCents;

    const donationId = await ctx.db.insert("donations", {
      creatorId: creator._id,
      donorName: args.donorName || "Anonymous",
      donorEmail: args.donorEmail,
      gallons: args.gallons,
      amountCents: args.amountCents,
      netCents,
      feeCents,
      status: "completed",
      stripeSessionId: args.stripeSessionId,
      stripePaymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
    });

    const newTotalGallons = creator.totalGallons + args.gallons;
    const newTotalCentsRaised = creator.totalCentsRaised + args.amountCents;
    const newBalanceCents = creator.balanceCents + netCents;

    await ctx.db.patch(creator._id, {
      totalGallons: newTotalGallons,
      totalCentsRaised: newTotalCentsRaised,
      balanceCents: newBalanceCents,
      updatedAt: Date.now(),
    });

    return { success: true, donationId };
  },
});
