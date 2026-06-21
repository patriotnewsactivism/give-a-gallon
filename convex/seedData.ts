import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const seedCreators = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have creators to avoid double-seeding
    const existing = await ctx.db.query("creators").take(1);
    if (existing.length > 0) return { message: "Creators already seeded" };

    // Create a dummy user for seeded creators if needed,
    // but we can also just insert into creators table directly for seeding.
    // In a real scenario, they'd have userIds.

    const creators = [
      {
        displayName: "Matthew Reardon",
        slug: "matthew-reardon",
        bio: "Founder of We The People News. Covering corruption and civic action in the field. Every gallon keeps the camera rolling.",
        category: "investigative-journalism",
        location: "National",
        totalGallons: 1240,
        totalDonations: 82,
        totalAmountCents: 1240 * 425,
        isActive: true,
        verificationStatus: "platform",
        isFeatured: true,
        featuredNote: "Founder's Choice: Essential investigative reporting.",
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      },
      {
        displayName: "Civil Rights Hub",
        slug: "civil-rights-hub",
        bio: "Getting people to the courthouse. We fuel the transport for those fighting for their constitutional rights.",
        category: "constitutional-rights",
        location: "Mobile, AL",
        totalGallons: 850,
        totalDonations: 45,
        totalAmountCents: 850 * 425,
        isActive: true,
        verificationStatus: "organization",
        isFeatured: true,
        featuredNote: "Verified Organization: Direct support for legal access.",
        createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      },
      {
        displayName: "Veteran Transport Squad",
        slug: "vet-transport",
        bio: "Volunteer drivers getting veterans to their VA appointments when public transport fails them. Fuel is our only cost.",
        category: "veterans",
        location: "Jacksonville, FL",
        totalGallons: 420,
        totalDonations: 28,
        totalAmountCents: 420 * 425,
        isActive: true,
        verificationStatus: "community",
        createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      },
      {
        displayName: "The Border Watch",
        slug: "border-watch",
        bio: "Independent documentary team filming on-location. 2,000 miles of border means a lot of gas.",
        category: "content-creators",
        location: "Texas Border",
        totalGallons: 215,
        totalDonations: 15,
        totalAmountCents: 215 * 425,
        isActive: true,
        verificationStatus: "journalist",
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      },
      {
        displayName: "Records Request Roadtrip",
        slug: "records-roadtrip",
        bio: "Traveling to 12 county seats to file manual public records requests for the 2026 audit.",
        category: "public-records",
        location: "Georgia",
        totalGallons: 95,
        totalDonations: 12,
        totalAmountCents: 95 * 425,
        isActive: true,
        verificationStatus: "community",
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      },
      {
        displayName: "Urgent: Family Medical Travel",
        slug: "family-travel-help",
        bio: "Need to get my daughter to a specialist 300 miles away. Gas is the only thing standing in our way.",
        category: "family-emergency",
        location: "Rural Ohio",
        totalGallons: 45,
        totalDonations: 8,
        totalAmountCents: 45 * 425,
        isActive: true,
        verificationStatus: "unverified",
        urgency: "high",
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
    ];

    const creatorIds = [];
    for (const creator of creators) {
      const id = await ctx.db.insert("creators", {
        ...creator,
        verificationStatus: creator.verificationStatus as "unverified" | "community" | "journalist" | "organization" | "platform",
        userId: "jd74v6ksf8m9p0q2r4t5v6x7" as any,
      });
      creatorIds.push({ id, slug: creator.slug, displayName: creator.displayName });
    }

    // Seed some donations
    const donationData = [
      { gallons: 5, donorName: "Alice S.", creatorSlug: "matthew-reardon" },
      { gallons: 2, donorName: "Bob J.", creatorSlug: "civil-rights-hub" },
      { gallons: 10, donorName: "Charlie D.", creatorSlug: "vet-transport" },
      { gallons: 1, donorName: "Dana W.", creatorSlug: "border-watch" },
      { gallons: 3, donorName: "Eve R.", creatorSlug: "records-roadtrip" },
      { gallons: 20, donorName: "Frank M.", creatorSlug: "matthew-reardon" },
    ];

    for (const d of donationData) {
      const creator = creatorIds.find(c => c.slug === d.creatorSlug);
      if (creator) {
        await ctx.db.insert("donations", {
          creatorId: creator.id,
          gallons: d.gallons,
          amountCents: d.gallons * 425,
          platformFeeCents: Math.round(d.gallons * 425 * 0.05),
          donorName: d.donorName,
          isAnonymous: false,
          status: "completed",
          createdAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        });
      }
    }

    // Seed some updates (Proof after payout)
    for (const creator of creatorIds) {
      await ctx.db.insert("updates", {
        creatorId: creator.id,
        title: "Fueled up and rolling",
        body: `Just gassed up and headed to the ${creator.displayName === "Civil Rights Hub" ? "courthouse" : "next location"}. Thanks for the fuel!`,
        gallonsUsed: Math.floor(Math.random() * 20) + 5,
        impactTag: "Movement",
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      });
    }

    return { message: `${creators.length} creators, ${donationData.length} donations, and updates seeded` };
  },
});
