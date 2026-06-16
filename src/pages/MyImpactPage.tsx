import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Fuel, MapPin, Heart, ExternalLink, Zap, TrendingUp, Users, Award } from "lucide-react";
import { Reveal } from "@/components/Reveal";


function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const VERIFICATION_BADGE: Record<string, { label: string; color: string }> = {
  unverified:   { label: "Unverified",        color: "text-muted-foreground" },
  community:    { label: "Community ✓",        color: "text-blue-400" },
  journalist:   { label: "Journalist ✓",       color: "text-purple-400" },
  organization: { label: "Organization ✓",     color: "text-orange-400" },
  platform:     { label: "Platform Verified ✓", color: "text-fuel" },
};

const IMPACT_TAG_ICON: Record<string, string> = {
  "miles driven":   "🛣️",
  "records filed":  "📄",
  "case won":       "⚖️",
  "story published":"📰",
  "hearing attended":"🏛️",
  "default":        "✦",
};

export function MyImpactPage() {
  const summary = useQuery(api.donations.getMyImpactSummary);
  const donations = useQuery(api.donations.getMyDonations);

  if (summary === undefined || donations === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-fuel border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your impact…</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Fuel className="size-10 text-fuel mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to see your impact</h2>
          <p className="text-muted-foreground text-sm mb-6">Every gallon you've given is tracked here.</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-fuel text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-fuel/90 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <div className="border-b border-border/30 bg-gradient-to-b from-fuel/[0.06] to-transparent py-12 sm:py-16">
        <div className="container max-w-4xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuel/10 text-fuel text-xs font-semibold mb-4">
              <Heart className="size-3 fill-current" /> YOUR IMPACT
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              Your Fuel. Their Fight.
            </h1>
            <p className="text-muted-foreground text-base max-w-lg">
              Every gallon you've given — and every outcome it made possible.
            </p>
          </Reveal>

          {/* Stats row */}
          <Reveal>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Fuel className="size-4 text-fuel" />}
                label="Gallons Given"
                value={summary.totalGallons.toLocaleString()}
              />
              <StatCard
                icon={<MapPin className="size-4 text-blue-400" />}
                label="Est. Miles Fueled"
                value={`~${summary.estimatedMiles.toLocaleString()}`}
              />
              <StatCard
                icon={<Users className="size-4 text-purple-400" />}
                label="Campaigns Fueled"
                value={summary.uniqueCreators.toString()}
              />
              <StatCard
                icon={<TrendingUp className="size-4 text-green-400" />}
                label="Total Contributed"
                value={formatCents(summary.totalAmountCents)}
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Donation history */}
      <div className="container max-w-4xl mt-10">
        {donations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Reveal>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                <Zap className="size-4 text-fuel" />
                Your Giving History
                <span className="ml-auto text-xs text-muted-foreground font-normal">{donations.length} donation{donations.length !== 1 ? "s" : ""}</span>
              </h2>
            </Reveal>
            <div className="space-y-4">
              {donations.map((d) => (
                <DonationCard key={d._id} donation={d} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function DonationCard({ donation }: { donation: any }) {
  const badge = VERIFICATION_BADGE[donation.creatorVerification] ?? VERIFICATION_BADGE.unverified;
  const estimatedMiles = Math.round(donation.gallons * 30);

  return (
    <Reveal>
      <div className="rounded-2xl border border-border/30 bg-card/30 overflow-hidden">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                to={`/${donation.creatorSlug}`}
                className="font-bold text-base hover:text-fuel transition-colors truncate"
              >
                {donation.creatorName}
              </Link>
              <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
            </div>
            {donation.creatorCategory && (
              <span className="text-xs text-muted-foreground capitalize">{donation.creatorCategory.replace(/_/g, " ")}</span>
            )}
            {donation.message && (
              <p className="mt-2 text-sm text-muted-foreground italic">"{donation.message}"</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="text-xl font-black text-fuel">{donation.gallons} <span className="text-sm font-normal text-muted-foreground">gal</span></div>
            <div className="text-xs text-muted-foreground">{formatCents(donation.amountCents)}</div>
          </div>
        </div>

        {/* Impact bar */}
        <div className="border-t border-border/20 bg-muted/10 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            ~{estimatedMiles} miles fueled
          </div>
          <div className="text-xs text-muted-foreground">{formatDate(donation.createdAt)}</div>
          <Link
            to={`/${donation.creatorSlug}`}
            className="flex items-center gap-1 text-xs text-fuel hover:underline ml-auto"
          >
            View campaign <ExternalLink className="size-2.5" />
          </Link>
        </div>

        {/* Impact updates from this creator after donation */}
        {donation.recentUpdates && donation.recentUpdates.length > 0 && (
          <div className="border-t border-border/20 px-5 py-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Award className="size-3 text-fuel" /> Impact since your donation
            </div>
            {donation.recentUpdates.map((u: any) => (
              <div key={u._id} className="flex items-center gap-2 text-xs">
                <span>{IMPACT_TAG_ICON[u.impactTag] ?? IMPACT_TAG_ICON.default}</span>
                <span className="text-foreground/80">{u.title}</span>
                <span className="text-muted-foreground ml-auto shrink-0">{formatDate(u.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

function EmptyState() {
  return (
    <Reveal>
      <div className="text-center py-16">
        <Fuel className="size-12 text-fuel/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">No gallons given yet</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          Find a journalist, activist, or creator doing work that matters — and fuel their mission.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 bg-fuel text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-fuel/90 transition-colors"
        >
          <Fuel className="size-4" /> Browse Campaigns
        </Link>
      </div>
    </Reveal>
  );
}
