import { createAccount } from "@convex-dev/auth/server";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─── Seed platform stats (safe to call any time) ──────────────────────────
export const seedPlatformStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const statsExists = await ctx.db
      .query("platformStats")
      .withIndex("by_key", q => q.eq("key", "global"))
      .first();

    if (statsExists) {
      await ctx.db.patch(statsExists._id, {
        totalDonationsCents: 347820,
        totalGallons: 867,
        totalDonors: 412,
        totalCreators: 23,
        totalCampaigns: 31,
        successfulCampaigns: 14,
        activeSubscriptions: 47,
        monthlyRecurringCents: 128500,
        updatedAt: now,
      });
      return { updated: true };
    }

    await ctx.db.insert("platformStats", {
      key: "global",
      totalDonationsCents: 347820,
      totalGallons: 867,
      totalDonors: 412,
      totalCreators: 23,
      totalCampaigns: 31,
      successfulCampaigns: 14,
      activeSubscriptions: 47,
      monthlyRecurringCents: 128500,
      updatedAt: now,
    });
    return { inserted: true };
  },
});

// ─── Create a seed user + creator pair ────────────────────────────────────
export const createSeedCreator = internalMutation({
  args: {
    userId: v.id("users"),
    slug: v.string(),
    displayName: v.string(),
    bio: v.string(),
    category: v.string(),
    location: v.string(),
    totalGallons: v.number(),
    goal: v.number(),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("community"),
      v.literal("journalist"),
      v.literal("organization"),
      v.literal("platform"),
    ),
    tags: v.array(v.string()),
    urgency: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .first();
    if (existing) return existing._id;

    const id = await ctx.db.insert("creators", {
      userId: args.userId,
      slug: args.slug,
      displayName: args.displayName,
      bio: args.bio,
      category: args.category,
      location: args.location,
      totalGallons: args.totalGallons,
      totalDonations: Math.floor(args.totalGallons * 1.4),
      totalAmountCents: args.totalGallons * 385,
      goal: args.goal,
      isActive: true,
      verificationStatus: args.verificationStatus,
      tags: args.tags,
      urgency: args.urgency,
      isFeatured: args.isFeatured ?? false,
      createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
    });
    return id;
  },
});

// ─── Create a seed donation ────────────────────────────────────────────────
export const createSeedDonation = internalMutation({
  args: {
    creatorId: v.id("creators"),
    donorName: v.string(),
    gallons: v.number(),
    message: v.optional(v.string()),
    campaignName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("donations", {
      creatorId: args.creatorId,
      donorName: args.donorName,
      gallons: args.gallons,
      amountCents: args.gallons * 385,
      platformFeeCents: Math.round(args.gallons * 385 * 0.05),
      message: args.message,
      isAnonymous: false,
      status: "completed",
      createdAt: Date.now() - Math.floor(Math.random() * 7200000), // within last 2h
    });
  },
});

// ─── Main seed action — orchestrates everything ───────────────────────────
export const seedAll = internalAction({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; message: string }> => {
    const now = Date.now();

    // 1. Seed platform stats
    await ctx.runMutation(internal.viktorTools.seedPlatformStats, {});

    // 2. Create seed auth users then creators
    const campaigns = [
      {
        email: "seed-marcus@give-a-gallon.test",
        name: "Marcus Webb",
        slug: "marcus-webb-records",
        displayName: "Marcus Webb",
        bio: "Investigative journalist filing public records requests to expose city contract fraud. Every gallon gets me to the courthouse and back.",
        category: "Investigative Journalism",
        location: "Detroit, MI",
        totalGallons: 142,
        goal: 200,
        verificationStatus: "journalist" as const,
        tags: ["public-records", "corruption", "local-government"],
        urgency: "active",
        isFeatured: true,
      },
      {
        email: "seed-leticia@give-a-gallon.test",
        name: "Leticia Ramos",
        slug: "leticia-ramos-rights",
        displayName: "Leticia Ramos",
        bio: "Civil rights attorney challenging illegal stop-and-frisk policies in court. Fuel helps me attend hearings 90 miles away.",
        category: "Constitutional Rights Cases",
        location: "Houston, TX",
        totalGallons: 87,
        goal: 150,
        verificationStatus: "organization" as const,
        tags: ["civil-rights", "legal", "court"],
        urgency: "urgent",
        isFeatured: true,
      },
      {
        email: "seed-carl@give-a-gallon.test",
        name: "Carl Briggs",
        slug: "carl-briggs-veteran",
        displayName: "Carl Briggs — Veteran",
        bio: "Army veteran, 3 tours. I drive 60 miles each way to the VA for treatment. Gas money shouldn't be the reason I miss an appointment.",
        category: "Veterans",
        location: "Tulsa, OK",
        totalGallons: 213,
        goal: 300,
        verificationStatus: "community" as const,
        tags: ["veteran", "va", "healthcare", "transportation"],
        urgency: "ongoing",
        isFeatured: true,
      },
      {
        email: "seed-diana@give-a-gallon.test",
        name: "Diana Osei",
        slug: "diana-osei-watchdog",
        displayName: "Diana Osei — Watchdog",
        bio: "Community watchdog covering school board meetings and county commissioner sessions that local media ignores completely.",
        category: "Activism Campaigns",
        location: "Atlanta, GA",
        totalGallons: 56,
        goal: 100,
        verificationStatus: "community" as const,
        tags: ["accountability", "local-government", "school-board"],
        urgency: "active",
      },
      {
        email: "seed-tom@give-a-gallon.test",
        name: "Tom Carver",
        slug: "tom-carver-disaster",
        displayName: "Tom Carver — Disaster Response",
        bio: "Volunteer coordinator driving supplies to flood-affected families in rural areas that FEMA hasn't reached yet.",
        category: "Disaster Relief",
        location: "Baton Rouge, LA",
        totalGallons: 329,
        goal: 400,
        verificationStatus: "platform" as const,
        tags: ["disaster", "flood", "volunteer", "emergency"],
        urgency: "critical",
        isFeatured: true,
      },
    ];

    const createdIds: string[] = [];

    for (const campaign of campaigns) {
      try {
        // Create auth user
        const { user } = await createAccount(ctx, {
          provider: "test",
          account: { id: campaign.email, secret: "seed-password-not-for-login" },
          profile: { email: campaign.email, name: campaign.name, emailVerificationTime: now },
          shouldLinkViaEmail: false,
        });

        // Create creator profile
        const creatorId = await ctx.runMutation(internal.viktorTools.createSeedCreator, {
          userId: user._id as any,
          slug: campaign.slug,
          displayName: campaign.displayName,
          bio: campaign.bio,
          category: campaign.category,
          location: campaign.location,
          totalGallons: campaign.totalGallons,
          goal: campaign.goal,
          verificationStatus: campaign.verificationStatus,
          tags: campaign.tags,
          urgency: campaign.urgency,
          isFeatured: campaign.isFeatured ?? false,
        });

        createdIds.push(String(creatorId));

        // Seed a few donations per campaign
        const donorNames = ["Sarah M.", "James T.", "Anonymous", "Pat K.", "Robin L."];
        for (let i = 0; i < 3; i++) {
          await ctx.runMutation(internal.viktorTools.createSeedDonation, {
            creatorId: creatorId as any,
            donorName: donorNames[i % donorNames.length],
            gallons: Math.floor(Math.random() * 4) + 1,
            campaignName: campaign.displayName,
            message: i === 0 ? "Keep fighting. We've got you." : undefined,
          });
        }
      } catch (err: any) {
        // Creator may already exist — skip
        if (!err.message?.includes("already exists")) {
          console.error(`Seed error for ${campaign.slug}:`, err.message);
        }
      }
    }

    return {
      ok: true,
      message: `Seeded ${createdIds.length} campaigns + platform stats.`,
    };
  },
});
