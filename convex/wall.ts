import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_LEN = 500;

// Public: list supporter-wall messages for a campaign (newest first).
export const listForCreator = query({
  args: { creatorId: v.id("creators"), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    return await ctx.db
      .query("wallPosts")
      .withIndex("by_creator", q => q.eq("creatorId", creatorId))
      .order("desc")
      .take(limit ?? 100);
  },
});

// Post a message of support. Requires a signed-in account (anti-spam).
export const post = mutation({
  args: { creatorId: v.id("creators"), body: v.string() },
  handler: async (ctx, { creatorId, body }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to leave a message");

    const text = body.trim();
    if (!text) throw new Error("Write a message first");
    if (text.length > MAX_LEN) {
      throw new Error(`Keep it under ${MAX_LEN} characters`);
    }

    const creator = await ctx.db.get(creatorId);
    if (!creator) throw new Error("Campaign not found");

    const user = await ctx.db.get(userId);
    const authorName =
      (user as { name?: string; email?: string } | null)?.name ||
      (user as { email?: string } | null)?.email?.split("@")[0] ||
      "Supporter";

    return await ctx.db.insert("wallPosts", {
      creatorId,
      userId,
      authorName,
      body: text,
      createdAt: Date.now(),
    });
  },
});

// Remove a wall post — allowed for the author or the campaign owner.
export const remove = mutation({
  args: { id: v.id("wallPosts") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(id);
    if (!post) return;

    const creator = await ctx.db.get(post.creatorId);
    const isAuthor = post.userId === userId;
    const isOwner = !!creator && creator.userId === userId;
    if (!isAuthor && !isOwner) throw new Error("Not allowed");

    await ctx.db.delete(id);
  },
});
