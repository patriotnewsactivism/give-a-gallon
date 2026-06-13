import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Creator profiles — activists who receive donations
  creators: defineTable({
    userId: v.id("users"),
    slug: v.string(), // URL slug, e.g. "donmatthews"
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")), // uploaded avatar (Convex storage)
    coverImageId: v.optional(v.id("_storage")), // uploaded cover image
    goal: v.optional(v.number()), // gallon goal (e.g., 100 gallons)
    totalGallons: v.number(), // total gallons received
    totalDonations: v.number(), // total donation count
    totalAmountCents: v.number(), // total USD in cents
    isActive: v.boolean(),
    category: v.optional(v.string()), // "first-amendment", "civil-rights", etc.
    location: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        youtube: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
        instagram: v.optional(v.string()),
      }),
    ),
    stripeSessionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"])
    .index("by_active", ["isActive", "totalGallons"])
    .index("by_category", ["category", "isActive"]),

  // Individual donations
  donations: defineTable({
    creatorId: v.id("creators"),
    donorName: v.optional(v.string()), // display name (can be anonymous)
    donorEmail: v.optional(v.string()),
    gallons: v.number(),
    amountCents: v.number(), // total amount in cents
    platformFeeCents: v.number(), // our cut
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    stripeSessionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_creator", ["creatorId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),
});

export default schema;
