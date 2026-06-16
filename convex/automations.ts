/**
 * Automation helper functions — expose data for CRON and event-triggered tasks
 */
import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Get creators created in the last N milliseconds
 * Used by the "New Creator Profile Alert" automation
 */
export const getNewCreators = action({
  args: { windowMs: v.number() },
  handler: async (ctx, { windowMs }) => {
    const since = Date.now() - windowMs;
    
    // Query all active creators, sorted newest first
    const creators = await ctx.db
      .query("creators")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(100);
    
    // Filter to only those created in the window
    const newOnes = creators
      .filter(c => (c.createdAt ?? 0) > since)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    
    return newOnes.map(c => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      createdAt: c.createdAt,
    }));
  },
});
