import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

/**
 * Generate a short-lived upload URL for Convex file storage.
 * The client POSTs the file to this URL and gets back a storageId, which is
 * then attached to a record (e.g. a creator avatar or an update attachment).
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
