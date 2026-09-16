export const GALLON_PRICE_CENTS = 425; // $4.25 per gallon
export const PLATFORM_FEE_PERCENTAGE = 0.05;

// Keep this list aligned with src/lib/constants.ts. Some frontend pages import
// shared campaign metadata from the Convex constants module.
export const CATEGORIES = [
  {
    id: "fuel-assistance",
    label: "Fuel Assistance",
    icon: "⛽",
    description: "Basic transportation needs",
  },
  {
    id: "veterans",
    label: "Veterans",
    icon: "🎖️",
    description: "Serving those who served",
  },
  {
    id: "emergency-transport",
    label: "Emergency Transportation",
    icon: "🚨",
    description: "Urgent travel needs",
  },
  {
    id: "investigative-journalism",
    label: "Investigative Journalism",
    icon: "📰",
    description: "Independent reporting",
  },
  {
    id: "constitutional-rights",
    label: "Constitutional Rights",
    icon: "⚖️",
    description: "Legal battles worth fighting",
  },
  {
    id: "activism",
    label: "Activism",
    icon: "✊",
    description: "On-the-ground organizing",
  },
  {
    id: "public-records",
    label: "Public Records",
    icon: "📋",
    description: "Government accountability",
  },
  {
    id: "content-creators",
    label: "Content Creators",
    icon: "🎥",
    description: "Independent voices",
  },
  {
    id: "disaster-relief",
    label: "Disaster Relief",
    icon: "🏚️",
    description: "When disaster strikes",
  },
  {
    id: "family-emergency",
    label: "Family Emergency",
    icon: "❤️",
    description: "Families in crisis",
  },
] as const;

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
