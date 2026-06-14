import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const attachment = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
  contentType: v.string(),
  kind: v.union(v.literal("image"), v.literal("document")),
  size: v.number(),
});

// Public: list a creator's updates (newest first) with resolved media URLs.
export const listForCreator = query({
  args: { creatorId: v.id("creators"), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    const updates = await ctx.db
      .query("updates")
      .withIndex("by_creator", q => q.eq("creatorId", creatorId))
      .order("desc")
      .take(limit ?? 50);

    return await Promise.all(
      updates.map(async u => ({
        ...u,
        attachments: u.attachments
          ? await Promise.all(
              u.attachments.map(async a => ({
                ...a,
                url: await ctx.storage.getUrl(a.storageId),
              })),
            )
          : [],
      })),
    );
  },
});

// Post an update to the current user's own profile.
export const post = mutation({
  args: {
    title: v.optional(v.string()),
    body: v.string(),
    videoUrl: v.optional(v.string()),
    attachments: v.optional(v.array(attachment)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
    if (!creator) throw new Error("Create your profile first");

    const body = args.body.trim();
    const hasMedia =
      !!args.videoUrl?.trim() || (args.attachments?.length ?? 0) > 0;
    if (!body && !hasMedia) {
      throw new Error("Add a message, a photo/document, or a video link");
    }

    return await ctx.db.insert("updates", {
      creatorId: creator._id,
      title: args.title?.trim() || undefined,
      body,
      videoUrl: args.videoUrl?.trim() || undefined,
      attachments: args.attachments,
      createdAt: Date.now(),
    });
  },
});

// Delete one of the current user's own updates (and its stored files).
export const remove = mutation({
  args: { id: v.id("updates") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const update = await ctx.db.get(id);
    if (!update) return;
    const creator = await ctx.db.get(update.creatorId);
    if (!creator || creator.userId !== userId) {
      throw new Error("Not allowed");
    }

    if (update.attachments) {
      for (const a of update.attachments) {
        await ctx.storage.delete(a.storageId);
      }
    }
    await ctx.db.delete(id);
  },
});
