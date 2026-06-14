import { useConvexAuth } from "convex/react";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Flame,
  Heart,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";

const TIERS = [
  {
    id: "fuel-supporter",
    name: "Fuel Supporter",
    icon: Flame,
    price: 5,
    gallons: 1,
    color: "text-muted-foreground",
    borderClass: "border-border/50",
    bgClass: "bg-card/40",
    buttonClass: "border-border/50 text-foreground hover:border-fuel/50",
    perks: [
      "1 gallon/month to any campaign",
      "Supporter badge on donor wall",
      "Monthly impact digest",
    ],
  },
  {
    id: "community-builder",
    name: "Community Builder",
    icon: Heart,
    price: 15,
    gallons: 3,
    color: "text-blue-400",
    borderClass: "border-blue-500/30",
    bgClass: "bg-blue-500/[0.04]",
    buttonClass: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10",
    perks: [
      "3 gallons/month to split across campaigns",
      "Community Builder badge",
      "Weekly impact updates",
      "Early access to new campaigns",
    ],
  },
  {
    id: "freedom-partner",
    name: "Freedom Partner",
    icon: Shield,
    price: 30,
    gallons: 7,
    color: "text-fuel",
    borderClass: "border-fuel/40",
    bgClass: "bg-fuel/[0.05]",
    buttonClass: "bg-fuel text-fuel-foreground hover:bg-fuel/90",
    badge: "Most Popular",
    perks: [
      "7 gallons/month across campaigns",
      "Freedom Partner badge",
      "Direct creator updates in feed",
      "Vote on platform features",
      "Monthly transparency report",
    ],
  },
  {
    id: "impact-champion",
    name: "Impact Champion",
    icon: Crown,
    price: 75,
    gallons: 17,
    color: "text-amber-400",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-500/[0.04]",
    buttonClass: "border-amber-500/40 text-amber-400 hover:bg-amber-500/10",
    badge: "Top Tier",
    perks: [
      "17 gallons/month — maximum impact",
      "Impact Champion badge",
      "Named in campaign updates",
      "Direct line to platform team",
      "Annual impact report with your name",
      "Founding member recognition",
    ],
  },
] as const;

export function MembershipPage() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="min-h-screen">
      <div className="container py-12 sm:py-20 max-w-5xl">

        {/* Header */}
        <Reveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuel/10 text-fuel text-xs font-semibold mb-5">
            <Star className="size-3.5" /> RECURRING GIVING
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FUEL THE <span className="text-fuel">MOVEMENT</span>
            <br />EVERY MONTH
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            A one-time donation changes a day. A membership changes a life.
            Join thousands of monthly supporters keeping the fight funded.
          </p>
        </Reveal>

        {/* Tiers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <Reveal key={tier.id} delayMs={i * 80}>
                <div className={`relative flex flex-col rounded-2xl border p-5 h-full ${tier.borderClass} ${tier.bgClass}`}>
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-fuel text-fuel-foreground text-xs font-bold whitespace-nowrap">
                      {tier.badge}
                    </div>
                  )}

                  <div className={`rounded-xl p-2.5 inline-block mb-3 ${tier.bgClass} border ${tier.borderClass}`}>
                    <Icon className={`size-5 ${tier.color}`} />
                  </div>

                  <h3 className={`font-bold text-base mb-1 ${tier.color}`} style={{ fontFamily: "var(--font-display)" }}>
                    {tier.name.toUpperCase()}
                  </h3>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ≈ {tier.gallons} gallon{tier.gallons !== 1 ? "s" : ""}/month
                    </div>
                  </div>

                  <ul className="space-y-2 mb-5 flex-1">
                    {tier.perks.map(perk => (
                      <li key={perk} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`size-3.5 mt-0.5 shrink-0 ${tier.color}`} />
                        <span className="text-muted-foreground">{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full font-semibold ${tier.buttonClass}`}
                    asChild
                  >
                    <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                      {isAuthenticated ? "Coming Soon" : "Get Started"}
                      <ArrowRight className="size-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Why monthly section */}
        <Reveal>
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-10">
            <h2
              className="text-2xl font-bold text-center mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              WHY <span className="text-fuel">MONTHLY?</span>
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Predictable fuel",
                  desc: "Creators know what's coming. Predictable funding means they can plan investigations, file records requests, and commit to long-term campaigns.",
                },
                {
                  icon: Shield,
                  title: "Builds trust",
                  desc: "Monthly supporters get priority updates and direct visibility into outcomes. You'll know exactly what your fuel made possible.",
                },
                {
                  icon: Heart,
                  title: "Compounds impact",
                  desc: "$15/month is $180/year — enough to fund a FOIA request, a week of travel, or dozens of miles for a family in crisis. Small fuel, big outcomes.",
                },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="text-center">
                    <div className="inline-flex items-center justify-center size-10 rounded-xl bg-fuel/10 mb-3">
                      <Icon className="size-5 text-fuel" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Subscriptions launch soon — enter your email to be notified first.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm focus:outline-none focus:border-fuel/50"
            />
            <Button className="bg-fuel text-fuel-foreground hover:bg-fuel/90 shrink-0">
              Notify Me
            </Button>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
