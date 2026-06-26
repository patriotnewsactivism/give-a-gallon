export const APP_NAME = "Give a Gallon";
export const GALLON_PRICE = 4.25; // USD per gallon
export const PLATFORM_FEE_PCT = 0.05; // 5% platform fee
export const GALLON_PRESETS = [1, 3, 5, 10, 20];

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
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    badge: "●",
  },
  community: {
    label: "Community Verified",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    badge: "✓",
  },
  journalist: {
    label: "Journalist Verified",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    badge: "✓✓",
  },
  organization: {
    label: "Organization Verified",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    badge: "⬡",
  },
  platform: {
    label: "Platform Verified",
    color: "text-fuel",
    bg: "bg-fuel/10",
    badge: "✦",
  },
} as const;

export const URGENCY_LEVELS = {
  low: { label: "Ongoing", color: "text-muted-foreground" },
  medium: { label: "Active", color: "text-blue-400" },
  high: { label: "Urgent", color: "text-amber-400" },
  emergency: { label: "Emergency", color: "text-red-400" },
} as const;
