import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  creators: defineTable({
    userId: v.id("users"),
    slug: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    coverImageId: v.optional(v.id("_storage")),
    goal: v.optional(v.number()),
    totalGallons: v.number(),
    totalDonations: v.number(),
    totalAmountCents: v.number(),
    isActive: v.boolean(),
    // Expanded category system
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      youtube: v.optional(v.string()),
      twitter: v.optional(v.string()),
      website: v.optional(v.string()),
      instagram: v.optional(v.string()),
    })),
    stripeSessionId: v.optional(v.string()),
    // Stripe Connect
    stripeAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("restricted"),
    )),
    // Verification system
    verificationStatus: v.optional(v.union(
      v.literal("unverified"),
      v.literal("community"),
      v.literal("journalist"),
      v.literal("organization"),
      v.literal("platform"),
    )),
    verificationNote: v.optional(v.string()),
    // Campaign details
    campaignType: v.optional(v.string()), // "ongoing" | "goal-based" | "emergency"
    urgency: v.optional(v.string()),      // "low" | "medium" | "high" | "emergency"
    tags: v.optional(v.array(v.string())),
    // Phase 5 — editorial / network
    isFeatured: v.optional(v.boolean()),
    featuredNote: v.optional(v.string()), // editorial blurb
    networkSource: v.optional(v.string()), // "wtpnews" | "civilrightshub" | null
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"])
    .index("by_active", ["isActive", "totalGallons"])
    .index("by_category", ["category", "isActive"])
    .index("by_stripeAccount", ["stripeAccountId"]),

  // Campaign updates posted by creators
  updates: defineTable({
    creatorId: v.id("creators"),
    title: v.string(),
    body: v.string(),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    impactTag: v.optional(v.string()), // e.g. "records filed", "miles driven", "case won"
    gallonsUsed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorId", "createdAt"]),

  // Milestones on a campaign
  milestones: defineTable({
    creatorId: v.id("creators"),
    title: v.string(),
    description: v.optional(v.string()),
    targetCents: v.number(),
    completedAt: v.optional(v.number()),
    isCompleted: v.boolean(),
    order: v.number(),
  })
    .index("by_creator", ["creatorId", "order"]),

  donations: defineTable({
    creatorId: v.id("creators"),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    gallons: v.number(),
    amountCents: v.number(),
    platformFeeCents: v.number(),
    message: v.optional(v.string()),
    isAnonymous: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_creator", ["creatorId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),

  // Platform-wide stats (materialized, updated by triggers)
  platformStats: defineTable({
    key: v.string(), // "global"
    totalDonationsCents: v.number(),
    totalGallons: v.number(),
    totalDonors: v.number(),
    totalCreators: v.number(),
    totalCampaigns: v.number(),
    successfulCampaigns: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),
});

export default schema;
