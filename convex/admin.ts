/**
 * Admin-only Convex functions.
 * All mutations/queries here check that the caller's email matches
 * the ADMIN_EMAIL environment variable (set in Convex dashboard).
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── Auth helper ────────────────────────────────────────────────────────────
async function assertAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) throw new Error("ADMIN_EMAIL not configured");
  if (user?.email?.toLowerCase() !== adminEmail.toLowerCase()) {
    throw new Error("Not authorized");
  }
  return user;
}

// ── Admin: seed demo data ────────────────────────────────────────────────
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx): Promise<{ message: string }> => {
    await assertAdmin(ctx);
    return await ctx.runMutation(internal.seedData.seedCreators);
  },
});

// ── Admin: check if current user is admin ────────────────────────────────
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return false;
    return user?.email?.toLowerCase() === adminEmail.toLowerCase();
  },
});

// ── Admin: full creator list with user + donation stats ──────────────────
export const listAllCreators = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);

    const creators = await ctx.db
      .query("creators")
      .order("desc")
      .collect();

    const results = await Promise.all(
      creators.map(async (c) => {
        // Get the user record for last login
        const user = await ctx.db.get(c.userId);

        // Get auth sessions to find last login time
        const sessions = await ctx.db
          .query("authSessions")
          .filter((q) => q.eq(q.field("userId"), c.userId))
          .order("desc")
          .take(1);

        const lastLogin = sessions[0]?._creationTime ?? null;

        // Get most recent completed donation
        const lastDonation = await ctx.db
          .query("donations")
          .withIndex("by_creator", (q) => q.eq("creatorId", c._id))
          .order("desc")
          .first();

        const lastDonationCompleted = lastDonation?.status === "completed"
          ? lastDonation
          : await ctx.db
              .query("donations")
              .withIndex("by_creator", (q) => q.eq("creatorId", c._id))
              .filter((q) => q.eq(q.field("status"), "completed"))
              .order("desc")
              .first();

        return {
          _id: c._id,
          slug: c.slug,
          displayName: c.displayName,
          email: user?.email ?? null,
          category: c.category ?? null,
          location: c.location ?? null,
          isActive: c.isActive,
          totalGallons: c.totalGallons,
          totalDonations: c.totalDonations,
          totalAmountCents: c.totalAmountCents,
          goal: c.goal ?? null,
          verificationStatus: c.verificationStatus ?? "unverified",
          stripeAccountStatus: c.stripeAccountStatus ?? null,
          isFeatured: c.isFeatured ?? false,
          createdAt: c.createdAt,
          lastLoginAt: lastLogin,
          lastDonationAt: lastDonationCompleted?.createdAt ?? null,
          lastDonationGallons: lastDonationCompleted?.gallons ?? null,
          hasActiveGoal: !!(c.goal && c.goal > 0 && c.totalGallons < c.goal),
        };
      })
    );

    return results;
  },
});

// ── Admin: platform-wide stats snapshot ──────────────────────────────────
export const getPlatformOverview = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);

    const creators = await ctx.db.query("creators").collect();
    const activeCreators = creators.filter((c) => c.isActive);

    const allDonations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(500);

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Donations in last 24h
    const since24h = Date.now() - 86400000;
    const recent24h = allDonations.filter((d) => d.createdAt > since24h);

    // Donations in last 7d
    const since7d = Date.now() - 7 * 86400000;
    const recent7d = allDonations.filter((d) => d.createdAt > since7d);

    return {
      totalCreators: creators.length,
      activeCreators: activeCreators.length,
      totalGallons: creators.reduce((s, c) => s + c.totalGallons, 0),
      totalAmountCents: allDonations.reduce((s, d) => s + d.amountCents, 0),
      totalDonations: allDonations.length,
      activeSubscriptions: subscriptions.length,
      monthlyRecurringCents: subscriptions.reduce((s, s2) => s + s2.amountCents, 0),
      last24hDonations: recent24h.length,
      last24hAmountCents: recent24h.reduce((s, d) => s + d.amountCents, 0),
      last24hGallons: recent24h.reduce((s, d) => s + d.gallons, 0),
      last7dDonations: recent7d.length,
      last7dAmountCents: recent7d.reduce((s, d) => s + d.amountCents, 0),
    };
  },
});

// ── Admin: recent donations across all campaigns ──────────────────────────
export const listAllDonations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await assertAdmin(ctx);

    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(limit ?? 100);

    return await Promise.all(
      donations.map(async (d) => {
        const creator = await ctx.db.get(d.creatorId);
        return {
          _id: d._id,
          donorName: d.donorName ?? "Anonymous",
          donorEmail: d.donorEmail ?? null,
          gallons: d.gallons,
          amountCents: d.amountCents,
          message: d.message ?? null,
          createdAt: d.createdAt,
          creatorName: creator?.displayName ?? "Unknown",
          creatorSlug: creator?.slug ?? null,
        };
      })
    );
  },
});

// ── Admin: send push notification to all users ───────────────────────────
export const sendNotification = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("announcement"),
      v.literal("milestone"),
      v.literal("alert"),
    ),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("creators"),
      v.literal("donors"),
    ),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await assertAdmin(ctx);
    await ctx.db.insert("notifications", {
      title: args.title,
      body: args.body,
      type: args.type,
      targetAudience: args.targetAudience,
      link: args.link,
      sentBy: admin.email ?? "admin",
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

// ── Admin: list sent notifications ───────────────────────────────────────
export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    return await ctx.db
      .query("notifications")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

// ── Admin: toggle creator active status ──────────────────────────────────
export const toggleCreatorActive = mutation({
  args: { creatorId: v.id("creators"), isActive: v.boolean() },
  handler: async (ctx, { creatorId, isActive }) => {
    await assertAdmin(ctx);
    await ctx.db.patch(creatorId, { isActive });
    return { ok: true };
  },
});

// ── Admin: toggle featured ───────────────────────────────────────────────
export const toggleCreatorFeatured = mutation({
  args: { creatorId: v.id("creators"), isFeatured: v.boolean() },
  handler: async (ctx, { creatorId, isFeatured }) => {
    await assertAdmin(ctx);
    await ctx.db.patch(creatorId, { isFeatured });
    return { ok: true };
  },
});
