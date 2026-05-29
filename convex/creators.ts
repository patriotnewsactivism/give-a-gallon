import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get creator profile by slug (public)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", slug.toLowerCase()))
      .first();
    return creator;
  },
});

// Get creator profile for current user
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return creator;
  },
});

// List featured / active creators (public)
export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit ?? 20);
    return creators;
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const slug = args.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (slug.length < 3) throw new Error("Slug must be at least 3 characters");

    // Check slug uniqueness
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    const myProfile = await ctx.db
      .query("creators")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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
      totalGallons: 0,
      totalDonations: 0,
      totalAmountCents: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
