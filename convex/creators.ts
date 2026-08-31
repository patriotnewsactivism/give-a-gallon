import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { VERIFICATION_TIERS, VerificationTierKey } from "./constants";

export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("creators")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .take(10);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const updateVerificationTier = mutation({
  args: {
    creatorId: v.id("creators"),
    newTier: v.union(
      v.literal("unverified"),
      v.literal("community"),
      v.literal("journalist"),
      v.literal("organization"),
      v.literal("platform_verified")
    ),
    adminUserId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const adminUser = await ctx.db.get(args.adminUserId);
    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Unauthorized: Only administrators may change verification tiers.");
    }

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) {
      throw new Error("Creator not found");
    }

    const previousTier = creator.verificationStatus;
    await ctx.db.patch(creator._id, {
      verificationStatus: args.newTier,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("verificationAudits", {
      creatorId: creator._id,
      previousTier,
      newTier: args.newTier,
      actorId: adminUser._id,
      reason: args.reason,
      automated: false,
      timestamp: Date.now(),
    });

    return { success: true, updatedTier: args.newTier };
  },
});

export const triggerAutoVerificationCheck = mutation({
  args: {
    creatorId: v.id("creators"),
    systemUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("Creator not found");

    let eligibleTier: VerificationTierKey | null = null;
    if (creator.totalGallons >= 100 && creator.verificationStatus === "unverified") {
      eligibleTier = "community";
    }

    if (eligibleTier && eligibleTier !== creator.verificationStatus) {
      const prev = creator.verificationStatus;
      await ctx.db.patch(creator._id, {
        verificationStatus: eligibleTier,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("verificationAudits", {
        creatorId: creator._id,
        previousTier: prev,
        newTier: eligibleTier,
        actorId: args.systemUserId,
        reason: "Automated milestone threshold reached (>100 gallons)",
        automated: true,
        timestamp: Date.now(),
      });
      return { elevated: true, tier: eligibleTier };
    }
    return { elevated: false, tier: creator.verificationStatus };
  },
});
