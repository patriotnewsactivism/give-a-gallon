import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  creators: defineTable({
    userId: v.id("users"),
    slug: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    totalGallons: v.number(),
    totalCentsRaised: v.number(),
    goal: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    featuredNote: v.optional(v.string()),
    networkSource: v.optional(v.string()),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("community"),
      v.literal("journalist"),
      v.literal("organization"),
      v.literal("platform_verified")
    ),
    balanceCents: v.number(),
    disbursedCents: v.number(),
    paypalEmail: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_user", ["userId"])
    .index("by_featured", ["isFeatured"])
    .index("by_verification", ["verificationStatus"]),

  donations: defineTable({
    creatorId: v.id("creators"),
    donorId: v.optional(v.id("users")),
    donorName: v.string(),
    donorEmail: v.optional(v.string()),
    gallons: v.number(),
    amountCents: v.number(),
    netCents: v.number(),
    feeCents: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_creator_and_created", ["creatorId", "createdAt"])
    .index("by_status_and_created", ["status", "createdAt"])
    .index("by_stripe_session", ["stripeSessionId"]),

  payouts: defineTable({
    creatorId: v.id("creators"),
    provider: v.union(v.literal("paypal"), v.literal("stripe")),
    amountCents: v.number(),
    recipient: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("success"),
      v.literal("failed")
    ),
    payoutBatchId: v.optional(v.string()),
    payoutItemId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
    idempotencyKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_status", ["status"]),

  verificationAudits: defineTable({
    creatorId: v.id("creators"),
    previousTier: v.string(),
    newTier: v.string(),
    actorId: v.id("users"),
    reason: v.string(),
    automated: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_timestamp", ["timestamp"]),

  webhookDeduplications: defineTable({
    eventKey: v.string(),
    provider: v.string(),
    processedAt: v.number(),
  }).index("by_eventKey", ["eventKey"]),
});
