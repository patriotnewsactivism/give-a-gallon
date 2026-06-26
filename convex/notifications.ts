/**
 * Public notification queries — anyone can read notifications
 * (they're platform-wide announcements, not private messages).
 */
import { query } from "./_generated/server";

export const getRecent = query({
  args: {},
  handler: async ctx => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_created")
      .order("desc")
      .take(20);
  },
});

// Alias for unauthenticated contexts
export const getRecentPublic = query({
  args: {},
  handler: async ctx => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_created")
      .order("desc")
      .take(20);
  },
});
