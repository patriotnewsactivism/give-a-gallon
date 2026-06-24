import { useQuery } from "convex/react";
import {
  BarChart3,
  CheckCircle2,
  DollarSign,
  Droplets,
  Fuel,
  Globe,
  Heart,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { CATEGORIES } from "../../convex/constants";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";

function StatTile({
  icon: Icon,
  value,
  label,
  sub,
  accent,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Reveal>
      <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${accent ? "border-fuel/30 bg-fuel/[0.06]" : "border-border/50 bg-card/50"}`}>
        <div className={`rounded-xl p-2.5 inline-block ${accent ? "bg-fuel/15" : "bg-muted/40"}`}>
          <Icon className={`size-5 ${accent ? "text-fuel" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div
            className={`text-3xl font-bold tracking-tight ${accent ? "text-fuel" : ""}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            <CountUp value={value} />
          </div>
          <div className="text-sm font-medium mt-0.5">{label}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </div>
    </Reveal>
  );
}

export function ImpactPage() {
  const stats = useQuery(api.platform.getStats);
  const creators = useQuery(api.creators.listActive, { limit: 100 });

  const isLoading = stats === undefined || creators === undefined;

  const totalRaised = stats ? (stats.totalDonationsCents / 100) : 0;
  const gallons = stats?.totalGallons ?? 0;
  const campaigns = stats?.totalCampaigns ?? 0;
  const successful = stats?.successfulCampaigns ?? 0;
  const successRate = campaigns > 0 ? Math.round((successful / campaigns) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-fuel border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading platform stats…</p>
        </div>
      </div>
    );
  }
  const platformFeeCollected = totalRaised * 0.05;

  // Category breakdown
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    count: (creators ?? []).filter(c => c.category === cat.id).length,
    gallons: (creators ?? [])
      .filter(c => c.category === cat.id)
      .reduce((s, c) => s + c.totalGallons, 0),
  })).filter(c => c.count > 0).sort((a, b) => b.gallons - a.gallons);

  return (
    <div className="min-h-screen">
      <div className="container py-10 sm:py-16 max-w-5xl">

        {/* Header */}
        <Reveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuel/10 text-fuel text-xs font-semibold mb-4">
            <Globe className="size-3.5" />
            LIVE PLATFORM STATS
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            THE <span className="text-fuel">IMPACT</span> DASHBOARD
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Every number here is a real person who got somewhere they needed to be.
            We publish everything — donations, fees, outcomes.
          </p>
        </Reveal>

        {/* Primary stats grid */}
        {!stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-2xl bg-card/30 animate-pulse border border-border/30" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            <StatTile icon={Droplets} value={gallons} label="Gallons Funded" sub={`≈ ${Math.round(gallons * 30)} miles of travel`} accent />
            <StatTile icon={DollarSign} value={Math.round(totalRaised)} label="Total Raised ($)" sub="Across all campaigns" />
            <StatTile icon={Users} value={stats.totalDonors} label="Unique Donors" sub="People who fueled someone" />
            <StatTile icon={Fuel} value={campaigns} label="Active Campaigns" />
            <StatTile icon={CheckCircle2} value={successful} label="Funded Campaigns" sub={`${successRate}% success rate`} />
            <StatTile icon={TrendingUp} value={Math.round(platformFeeCollected)} label="Platform Fees ($)" sub="5% funds operations" />
          </div>
        )}

        {/* Transparency section */}
        <Reveal className="mb-12">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-fuel/10 p-2.5">
                <Shield className="size-5 text-fuel" />
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  FULL TRANSPARENCY
                </h2>
                <p className="text-sm text-muted-foreground">How every dollar flows</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { pct: "~92%", label: "Goes to creators", desc: "Net after PayPal processing", color: "text-fuel" },
                { pct: "5%", label: "Platform fee", desc: "Covers operations & development", color: "text-muted-foreground" },
                { pct: "~3%", label: "PayPal processing", desc: "Card processing (via PayPal)", color: "text-muted-foreground" },
              ].map(item => (
                <div key={item.label} className="text-center p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div className={`text-3xl font-bold mb-1 ${item.color}`} style={{ fontFamily: "var(--font-display)" }}>
                    {item.pct}
                  </div>
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <Reveal className="mb-12">
            <h2 className="font-bold text-xl mb-5 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <BarChart3 className="size-5 text-fuel" />
              GALLONS BY CAUSE
            </h2>
            <div className="space-y-3">
              {byCategory.map(cat => {
                const maxGallons = byCategory[0]?.gallons ?? 1;
                const pct = maxGallons > 0 ? Math.round((cat.gallons / maxGallons) * 100) : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-lg shrink-0 w-7 text-center">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate">{cat.label}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {cat.gallons} gal · {cat.count} campaign{cat.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-fuel transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* Mission statement */}
        <Reveal>
          <div className="rounded-2xl border border-fuel/20 bg-fuel/[0.04] p-6 sm:p-8 text-center">
            <Heart className="size-8 text-fuel mx-auto mb-4" />
            <blockquote
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              "ONE GALLON CAN CHANGE SOMEONE'S DAY.{" "}
              <span className="text-fuel">MANY GALLONS CAN CHANGE A LIFE."</span>
            </blockquote>
            <p className="text-muted-foreground max-w-md mx-auto">
              We don't stop at the donation. We track what happened because someone gave.
              That's the Give-A-Gallon promise.
            </p>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
