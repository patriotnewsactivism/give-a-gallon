/**
 * give-a-gallon — Referral System
 *
 * Flow:
 *  1. Creator gets a unique referral code (auto-generated on first access)
 *  2. Referral link: https://www.giveagallon.org/?ref=THEIRCODE
 *  3. When a donation completes, referral is credited to the referrer
 *  4. Referrer earns bonus gallons / leaderboard position
 */

import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Generate a short unique code ──────────────────────────────────────────────
function generateCode(slug: string): string {
  const base = slug.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}${rand}`;
}

// ── Get or create a referral code for the authenticated creator ───────────────
export const getMyReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!creator) throw new Error("Creator profile not found");

    if (creator.referralCode) return creator.referralCode;

    // Generate a unique code
    let code = generateCode(creator.slug);
    // Check uniqueness
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
      .first();
    if (existing) {
      code = generateCode(creator.slug + Date.now().toString(36));
    }

    await ctx.db.patch(creator._id, {
      referralCode: code,
      referralCount: 0,
      referralGallons: 0,
    });

    return code;
  },
});

// ── Update the referral code (personalization) ────────────────────────────────
export const updateReferralCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!creator) throw new Error("Creator profile not found");

    // Clean and validate code
    const newCode = code.replace(/[^a-z0-9_-]/gi, "").toUpperCase();
    if (newCode.length < 3) throw new Error("Code must be at least 3 characters");
    if (newCode.length > 20) throw new Error("Code must be 20 characters or less");

    // Check uniqueness
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", newCode))
      .first();
    
    if (existing && existing._id !== creator._id) {
      throw new Error("This referral code is already taken");
    }

    await ctx.db.patch(creator._id, {
      referralCode: newCode,
    });

    return newCode;
  },
});

// ── Get referral stats for the authenticated creator ──────────────────────────
export const getMyReferralStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!creator) return null;

    // Get all donations that were referred by this creator
    const referredDonations = creator.referralCode
      ? await ctx.db
          .query("donations")
          .filter((q) =>
            q.and(
              q.eq(q.field("referralCode"), creator.referralCode),
              q.eq(q.field("status"), "completed")
            )
          )
          .collect()
      : [];

    // Group by month for the chart
    const byMonth: Record<string, { donations: number; gallons: number }> = {};
    for (const d of referredDonations) {
      const month = new Date(d.createdAt).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      if (!byMonth[month]) byMonth[month] = { donations: 0, gallons: 0 };
      byMonth[month].donations += 1;
      byMonth[month].gallons += d.gallons;
    }

    const monthlyData = Object.entries(byMonth)
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }));

    // Top referrers leaderboard (all creators, sorted by referralGallons)
    const allCreators = await ctx.db
      .query("creators")
      .filter((q) =>
        q.and(
          q.gt(q.field("referralGallons"), 0),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    const leaderboard = allCreators
      .sort((a, b) => (b.referralGallons ?? 0) - (a.referralGallons ?? 0))
      .slice(0, 10)
      .map((c, i) => ({
        rank: i + 1,
        displayName: c.displayName,
        slug: c.slug,
        referralCount: c.referralCount ?? 0,
        referralGallons: c.referralGallons ?? 0,
        isMe: c._id === creator._id,
      }));

    return {
      referralCode: creator.referralCode ?? null,
      referralCount: creator.referralCount ?? 0,
      referralGallons: creator.referralGallons ?? 0,
      totalDonations: referredDonations.length,
      totalGallons: referredDonations.reduce((s, d) => s + d.gallons, 0),
      monthlyData,
      leaderboard,
    };
  },
});

// ── Lookup a creator by referral code (used at checkout time) ─────────────────
export const getCreatorByReferralCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("creators")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
      .first();
  },
});

// ── Credit a referral after a donation completes ──────────────────────────────
export const creditReferral = internalMutation({
  args: {
    referralCode: v.string(),
    gallons: v.number(),
    donationId: v.id("donations"),
  },
  handler: async (ctx, { referralCode, gallons, donationId }) => {
    const referrer = await ctx.db
      .query("creators")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
      .first();
    if (!referrer) return;

    await ctx.db.patch(referrer._id, {
      referralCount: (referrer.referralCount ?? 0) + 1,
      referralGallons: (referrer.referralGallons ?? 0) + gallons,
    });

    // Tag the donation with the referrer
    await ctx.db.patch(donationId, {
      referredByCreatorId: referrer._id,
    });
  },
});

// ── Public leaderboard (no auth required) ─────────────────────────────────────
export const getReferralLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db
      .query("creators")
      .filter((q) =>
        q.and(
          q.gt(q.field("referralGallons"), 0),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    return creators
      .sort((a, b) => (b.referralGallons ?? 0) - (a.referralGallons ?? 0))
      .slice(0, 20)
      .map((c, i) => ({
        rank: i + 1,
        displayName: c.displayName,
        slug: c.slug,
        referralCount: c.referralCount ?? 0,
        referralGallons: c.referralGallons ?? 0,
      }));
  },
});
