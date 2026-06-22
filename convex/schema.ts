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
    // Stripe Connect
    stripeAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("restricted"),
      ),
    ),
    // Verification system
    verificationStatus: v.optional(
      v.union(
        v.literal("unverified"),
        v.literal("community"),
        v.literal("journalist"),
        v.literal("organization"),
        v.literal("platform"),
      ),
    ),
    verificationNote: v.optional(v.string()),
    // Campaign details
    campaignType: v.optional(v.string()),
    urgency: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Phase 5 — editorial / network
    isFeatured: v.optional(v.boolean()),
    featuredNote: v.optional(v.string()),
    networkSource: v.optional(v.string()),
    // Referral
    referralCode: v.optional(v.string()),
    referralCount: v.optional(v.number()),
    referralGallons: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_slug", ["slug"])
    .index("by_userId", ["userId"])
    .index("by_active", ["isActive", "totalGallons"])
    .index("by_category", ["category", "isActive"])
    .index("by_stripeAccount", ["stripeAccountId"])
    .index("by_referralCode", ["referralCode"]),

  // Campaign updates posted by creators
  updates: defineTable({
    creatorId: v.id("creators"),
    title: v.string(),
    body: v.string(),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    impactTag: v.optional(v.string()),
    gallonsUsed: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_creator", ["creatorId", "createdAt"]),

  // Milestones on a campaign
  milestones: defineTable({
    creatorId: v.id("creators"),
    title: v.string(),
    description: v.optional(v.string()),
    targetCents: v.number(),
    completedAt: v.optional(v.number()),
    isCompleted: v.boolean(),
    order: v.number(),
  }).index("by_creator", ["creatorId", "order"]),

  donations: defineTable({
    creatorId: v.id("creators"),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    donorUserId: v.optional(v.id("users")),
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
    // Referral tracking
    referralCode: v.optional(v.string()),
    referredByCreatorId: v.optional(v.id("creators")),
    createdAt: v.number(),
  })
    .index("by_stripeSession", ["stripeSessionId"])
    .index("by_creator", ["creatorId", "createdAt"])
    .index("by_status", ["status", "createdAt"])
    .index("by_donorUser", ["donorUserId", "createdAt"]),

  // ── Subscriptions (recurring memberships) ──────────────────────────────────
  subscriptions: defineTable({
    userId: v.id("users"),
    donorEmail: v.string(),
    donorName: v.optional(v.string()),
    tierId: v.string(), // "fuel-supporter" | "community-builder" | "freedom-partner" | "impact-champion"
    tierName: v.string(),
    amountCents: v.number(), // monthly amount
    gallonsPerMonth: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("paused"),
    ),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()), // unix ms
    canceledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripeSubscription", ["stripeSubscriptionId"])
    .index("by_stripeCustomer", ["stripeCustomerId"])
    .index("by_status", ["status", "createdAt"]),

  // ── Platform-wide stats (materialized) ─────────────────────────────────────
  platformStats: defineTable({
    key: v.string(), // "global"
    totalDonationsCents: v.number(),
    totalGallons: v.number(),
    totalDonors: v.number(),
    totalCreators: v.number(),
    totalCampaigns: v.number(),
    successfulCampaigns: v.number(),
    activeSubscriptions: v.optional(v.number()),
    monthlyRecurringCents: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ── Email notification log ─────────────────────────────────────────────────
  emailLog: defineTable({
    to: v.string(),
    subject: v.string(),
    type: v.string(), // "donation_received" | "donation_confirmation" | "subscription_confirmed" | "subscription_canceled"
    relatedId: v.optional(v.string()),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_type", ["type", "createdAt"])
    .index("by_to", ["to", "createdAt"]),

  // ── Supporter wall — messages of support on a campaign ──────────────────────
  wallPosts: defineTable({
    creatorId: v.id("creators"),
    userId: v.id("users"),
    authorName: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_creator", ["creatorId", "createdAt"]),
  // ── Push notifications (admin → all users) ──────────────────────────────
  notifications: defineTable({
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("announcement"),
      v.literal("milestone"),
      v.literal("alert"),
    ),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("creators"),
      v.literal("donors"),
    ),
    link: v.optional(v.string()),
    sentBy: v.string(), // admin email
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // ── Per-user read receipts for notifications ─────────────────────────────
  notificationReads: defineTable({
    userId: v.id("users"),
    notificationId: v.id("notifications"),
    readAt: v.number(),
  })
    .index("by_user", ["userId", "notificationId"])
    .index("by_notification", ["notificationId"]),

  // ── Support tickets (contact form + email → AI assistant) ────────────────
  supportTickets: defineTable({
    name: v.string(),
    email: v.string(),
    category: v.string(), // "donation" | "creator" | "payout" | "account" | "other"
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("ai_replied"),
      v.literal("needs_human"),
      v.literal("closed"),
    ),
    aiReply: v.optional(v.string()),
    source: v.optional(v.string()), // "web" | "email"
    repliedAt: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_email", ["email", "createdAt"]),

  // ── Support conversation log (one row per message in a ticket thread) ─────
  supportMessages: defineTable({
    ticketId: v.id("supportTickets"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_ticket", ["ticketId", "createdAt"]),
});

export default schema;
