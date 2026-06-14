import { useConvexAuth, useMutation, useQuery, useAction } from "convex/react";
import { useState } from "react";
import {
  ArrowRight, CheckCircle2, Crown, Flame, Heart, Shield, Star, Zap,
  Loader2, AlertCircle, BadgeCheck, XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

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
    buttonVariant: "outline" as const,
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
    buttonVariant: "outline" as const,
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
    buttonVariant: "default" as const,
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
    buttonVariant: "outline" as const,
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
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const mySubscription = useQuery(api.subscriptions.getMySubscription);
  const stats = useQuery(api.subscriptions.getSubscriptionStats);
  const createCheckout = useAction(api.subscriptions.createSubscriptionCheckout);
  const cancelSub = useAction(api.subscriptions.cancelSubscription);

  const handleSubscribe = async (tierId: string) => {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    setLoadingTier(tierId);
    try {
      const { url } = await createCheckout({ tierId });
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong — please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your membership? You'll keep access until the end of your billing period.")) return;
    setCanceling(true);
    try {
      await cancelSub({});
      toast.success("Membership canceled. You'll keep access until your billing period ends.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to cancel — contact support.");
    } finally {
      setCanceling(false);
    }
  };

  const activeTierId = mySubscription?.tierId;

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
            Join monthly supporters keeping the fight funded.
          </p>

          {/* Live subscriber count */}
          {stats && stats.activeCount > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/40 text-sm">
              <div className="size-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">{stats.activeCount}</strong> active members ·{" "}
                <strong className="text-fuel">{stats.totalGallonsPerMonth.toLocaleString()}</strong> gal/month flowing
              </span>
            </div>
          )}
        </Reveal>

        {/* Active subscription banner */}
        {mySubscription && mySubscription.status === "active" && (
          <Reveal>
            <div className="mb-8 rounded-2xl border border-fuel/30 bg-fuel/[0.06] p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <BadgeCheck className="size-6 text-fuel shrink-0" />
                <div>
                  <div className="font-bold text-sm">You're a {mySubscription.tierName}</div>
                  <div className="text-xs text-muted-foreground">
                    {mySubscription.gallonsPerMonth} gal/month ·{" "}
                    {mySubscription.currentPeriodEnd
                      ? `Renews ${new Date(mySubscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : "Active"}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                {canceling ? "Canceling..." : "Cancel Membership"}
              </Button>
            </div>
          </Reveal>
        )}

        {/* Tiers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            const isActive = activeTierId === tier.id;
            const isLoading = loadingTier === tier.id;

            return (
              <Reveal key={tier.id} delayMs={i * 80}>
                <div className={`relative flex flex-col rounded-2xl border p-5 h-full transition-all ${
                  isActive ? "border-fuel/60 ring-1 ring-fuel/20" : tier.borderClass
                } ${tier.bgClass}`}>
                  {tier.badge && !isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-fuel text-fuel-foreground text-xs font-bold whitespace-nowrap">
                      {tier.badge}
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-fuel text-fuel-foreground text-xs font-bold whitespace-nowrap flex items-center gap-1">
                      <BadgeCheck className="size-3" /> Current Plan
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

                  {isActive ? (
                    <Button variant="outline" size="sm" className="w-full font-semibold border-fuel/30 text-fuel cursor-default" disabled>
                      <BadgeCheck className="size-3.5 mr-1" /> Active
                    </Button>
                  ) : (
                    <Button
                      variant={tier.buttonVariant}
                      size="sm"
                      className={`w-full font-semibold ${tier.buttonClass}`}
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isLoading || !!activeTierId}
                    >
                      {isLoading ? (
                        <><Loader2 className="size-3.5 animate-spin mr-1" /> Redirecting…</>
                      ) : (
                        <>{isAuthenticated ? "Subscribe" : "Get Started"} <ArrowRight className="size-3.5 ml-1" /></>
                      )}
                    </Button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Why monthly */}
        <Reveal>
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-10">
            <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "var(--font-display)" }}>
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
                  desc: "$15/month is $180/year — enough to fund a FOIA request, a week of travel, or dozens of miles for a family in crisis.",
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

        {/* FAQ */}
        <Reveal className="mt-10">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-center mb-6">Common Questions</h2>
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes — cancel from this page or your dashboard. You keep access through the end of your billing period, then it stops. No runaround.",
              },
              {
                q: "Where do my monthly gallons go?",
                a: "Right now monthly gallons pool into the platform fuel fund and flow to the most urgent active campaigns. Campaign-level allocation is coming soon.",
              },
              {
                q: "What's the 5% platform fee?",
                a: "Give-A-Gallon takes 5% to cover Stripe fees, server costs, and platform development. The rest goes directly to creators via Stripe Connect.",
              },
            ].map(item => (
              <div key={item.q} className="rounded-xl border border-border/40 bg-card/30 p-5">
                <div className="font-semibold text-sm mb-1.5 flex items-start gap-2">
                  <AlertCircle className="size-4 text-fuel shrink-0 mt-0.5" />
                  {item.q}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </Reveal>

      </div>
    </div>
  );
}
