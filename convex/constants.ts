export const GALLON_PRICE_CENTS = 425; // $4.25 per gallon
export const PLATFORM_FEE_PERCENTAGE = 0.05;

export const VERIFICATION_TIERS = {
  unverified: {
    label: "Unverified",
    rank: 0,
    badge: "New Activist",
    color: "text-gray-400",
  },
  community: {
    label: "Community",
    rank: 1,
    badge: "✦ Community Tier",
    color: "text-emerald-400",
  },
  journalist: {
    label: "Journalist",
    rank: 2,
    badge: "✦ Journalist",
    color: "text-blue-400",
  },
  organization: {
    label: "Organization",
    rank: 3,
    badge: "✦ Organization",
    color: "text-purple-400",
  },
  platform_verified: {
    label: "Platform Verified",
    rank: 4,
    badge: "✦ Platform Verified",
    color: "text-fuel",
  },
} as const;

export type VerificationTierKey = keyof typeof VERIFICATION_TIERS;
