import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Creator profiles — activists who receive donations
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
    stripeSessionId: v.optional(v.string()),
    // Stripe Connect Express fields
    stripeAccountId: v.optional(v.string()),       // acct_xxx
    stripeAccountStatus: v.optional(v.union(
      v.literal("pending"),     // onboarding link created, not yet completed
      v.literal("active"),      // KYC complete, can receive payouts
      v.literal("restricted"),  // Stripe requires more info
    )),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"])
    .index("by_active", ["isActive", "totalGallons"])
    .index("by_category", ["category", "isActive"])
    .index("by_stripeAccount", ["stripeAccountId"]),

  // Individual donations
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
    // Connect transfer tracking
    stripePaymentIntentId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_creator", ["creatorId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),
});

export default schema;
