import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

// Resolve uploaded storage ids to served URLs, falling back to any external
// URL fields. Returns the creator doc with `avatarUrl`/`coverUrl` populated.
async function withImageUrls(ctx: QueryCtx, creator: Doc<"creators">) {
  const avatarUrl = creator.avatarId
    ? await ctx.storage.getUrl(creator.avatarId)
    : (creator.avatarUrl ?? null);
  const coverUrl = creator.coverImageId
    ? await ctx.storage.getUrl(creator.coverImageId)
    : (creator.coverImageUrl ?? null);
  return { ...creator, avatarUrl, coverUrl };
}

// Get creator profile by slug (public)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", q => q.eq("slug", slug.toLowerCase()))
      .first();
    return creator ? await withImageUrls(ctx, creator) : null;
  },
});

// Get creator profile for current user
export const getMine = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
    return creator ? await withImageUrls(ctx, creator) : null;
  },
});

// List featured / active creators (public)
export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", q => q.eq("isActive", true))
      .order("desc")
      .take(limit ?? 20);
    return await Promise.all(creators.map(c => withImageUrls(ctx, c)));
  },
});

// Create or update creator profile
export const upsert = mutation({
  args: {
    displayName: v.string(),
    slug: v.string(),
    bio: v.optional(v.string()),
    goal: v.optional(v.number()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        youtube: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
        instagram: v.optional(v.string()),
      }),
    ),
    urgency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const slug = args.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (slug.length < 3) throw new Error("Slug must be at least 3 characters");

    // Check slug uniqueness
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", q => q.eq("slug", slug))
      .first();

    const myProfile = await ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    if (existing && existing._id !== myProfile?._id) {
      throw new Error("This URL is already taken");
    }

    if (myProfile) {
      // Update existing
      await ctx.db.patch(myProfile._id, {
        displayName: args.displayName,
        slug,
        bio: args.bio,
        goal: args.goal,
        category: args.category,
        location: args.location,
        socialLinks: args.socialLinks,
        urgency: args.urgency,
      });
      return myProfile._id;
    }

    // Create new
    return await ctx.db.insert("creators", {
      userId,
      displayName: args.displayName,
      slug,
      bio: args.bio,
      goal: args.goal,
      category: args.category,
      location: args.location,
      socialLinks: args.socialLinks,
      urgency: args.urgency,
      totalGallons: 0,
      totalDonations: 0,
      totalAmountCents: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Set / replace the avatar or cover image for the current user's profile.
// Pass a storageId to set, or null to remove. Omit a field to leave it as-is.
export const setImages = mutation({
  args: {
    avatarId: v.optional(v.union(v.id("_storage"), v.null())),
    coverImageId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const mine = await ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
    if (!mine) throw new Error("Create your profile first");

    const patch: Partial<Doc<"creators">> = {};
    if (args.avatarId !== undefined) {
      if (mine.avatarId && mine.avatarId !== args.avatarId) {
        await ctx.storage.delete(mine.avatarId);
      }
      patch.avatarId = args.avatarId ?? undefined;
    }
    if (args.coverImageId !== undefined) {
      if (mine.coverImageId && mine.coverImageId !== args.coverImageId) {
        await ctx.storage.delete(mine.coverImageId);
      }
      patch.coverImageId = args.coverImageId ?? undefined;
    }
    await ctx.db.patch(mine._id, patch);
  },
});

// Get creator by ID (public — used on donation success page)
export const getById = query({
  args: { id: v.id("creators") },
  handler: async (ctx, { id }) => {
    const creator = await ctx.db.get(id);
    return creator ? await withImageUrls(ctx, creator) : null;
  },
});

// Get editorially featured campaigns (Phase 5)
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    const featured = creators.filter((c) => c.isFeatured === true);
    return await Promise.all(featured.map((c) => withImageUrls(ctx, c)));
  },
});

// Platform-wide aggregate stats for the public leaderboard page
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const donations = await ctx.db.query("donations").collect();
    const completed = donations.filter((d) => d.status === "completed");

    return {
      totalCreators: creators.length,
      totalGallons: creators.reduce((s, c) => s + (c.totalGallons ?? 0), 0),
      totalDonations: completed.length,
      totalAmountCents: completed.reduce((s, d) => s + (d.amountCents ?? 0), 0),
    };
  },
});

// Newest active creator profiles — for the landing page "Just Joined" strip
export const listNewest = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit ?? 12);
    // Sort by createdAt descending so newest appear first
    const sorted = creators.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return await Promise.all(sorted.map((c) => withImageUrls(ctx, c)));
  },
});
