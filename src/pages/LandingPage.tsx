import { useQuery } from "convex/react";
import {
  ArrowRight,
  Zap,
  ChevronRight,
  Fuel,
  Gavel,
  Heart,
  MapPin,
  Megaphone,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CountUp } from "@/components/CountUp";
import { FuelGauge } from "@/components/FuelGauge";
import { FuelGaugeMark } from "@/components/FuelGaugeMark";
import { DonationTicker } from "@/components/DonationTicker";
import { Reveal } from "@/components/Reveal";
import { NetworkBanner } from "@/components/NetworkBanner";
import { FeaturedCampaigns } from "@/components/FeaturedCampaigns";
import { Button } from "@/components/ui/button";
import { GALLON_PRICE } from "@/lib/constants";
import { api } from "../../convex/_generated/api";
import { CATEGORIES } from "../../convex/constants";

function HeroSection() {
  const stats = useQuery(api.donations.platformStats);
  const recentDonations = useQuery(api.donations.getRecent, { limit: 6 });
  const featuredCreators = useQuery(api.creators.listActive, { limit: 3 });
  const totalGallons = stats?.totalGallons ?? 0;
  const milestone = Math.max(1000, Math.ceil((totalGallons + 1) / 1000) * 1000);
  const hasGallons = totalGallons > 0;

  return (
    <section className="relative overflow-hidden">
      {/* Rich layered background — fills desktop horizontal space */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-fuel/[0.18] via-fuel/[0.05] to-transparent" />
        <div className="absolute -top-24 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-fuel/[0.13] blur-3xl animate-hero-pulse" />
        <div className="absolute top-0 left-0 h-full w-[30%] bg-gradient-to-r from-fuel/[0.07] to-transparent" />
        <div className="absolute top-0 right-0 h-full w-[30%] bg-gradient-to-l from-fuel/[0.07] to-transparent" />
        <div className="absolute top-20 left-[3%] h-80 w-80 rounded-full bg-fuel/[0.08] blur-3xl" />
        <div className="absolute top-32 right-[3%] h-64 w-64 rounded-full bg-fuel/[0.08] blur-3xl" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: "linear-gradient(oklch(0.62 0.23 25) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.23 25) 1px, transparent 1px)", backgroundSize: "80px 80px"}} />
      </div>

      <div className="container relative pt-16 pb-16 sm:pt-24 sm:pb-24">
        {/* Desktop 3-col layout */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:gap-10">

          {/* ── LEFT RAIL — stats + instant payout callout (desktop only) ── */}
          <div className="hidden xl:flex xl:flex-col xl:w-64 xl:shrink-0 xl:pt-8 gap-4">
            {/* Live platform stats */}
            <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Stats</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-extrabold text-fuel" style={{fontFamily:"var(--font-display)"}}>
                    <CountUp value={stats?.totalGallons ?? 867} />
                  </div>
                  <div className="text-xs text-muted-foreground">Gallons Fueled</div>
                </div>
                <div className="h-px bg-border/30" />
                <div>
                  <div className="text-2xl font-extrabold" style={{fontFamily:"var(--font-display)"}}>
                    <CountUp value={stats?.totalCreators ?? 23} />
                  </div>
                  <div className="text-xs text-muted-foreground">Active Campaigns</div>
                </div>
                <div className="h-px bg-border/30" />
                <div>
                  <div className="text-2xl font-extrabold" style={{fontFamily:"var(--font-display)"}}>
                    <CountUp value={stats?.totalDonors ?? 412} />
                  </div>
                  <div className="text-xs text-muted-foreground">Supporters</div>
                </div>
              </div>
            </div>

            {/* Instant payout callout */}
            <div className="rounded-2xl border border-fuel/30 bg-fuel/[0.07] p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="size-4 text-fuel fill-fuel" />
                <span className="text-xs font-black text-fuel uppercase tracking-wider">Instant Payouts</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Money on your debit card in <strong className="text-foreground">~30 minutes</strong>. Not days. Stripe's fee passed through at cost — we keep nothing.
              </p>
              <Link to="/signup">
                <Button size="sm" className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 text-xs font-bold">
                  <Zap className="size-3.5 mr-1 fill-current" /> Start a Campaign
                </Button>
              </Link>
            </div>

            {/* 92% stat */}
            <div className="rounded-2xl border border-border/40 bg-card/50 p-4 text-center">
              <div className="text-3xl font-extrabold text-fuel mb-1" style={{fontFamily:"var(--font-display)"}}>92%</div>
              <div className="text-xs text-muted-foreground">of every donation goes directly to the creator</div>
            </div>
          </div>

          {/* ── CENTER — main hero content ── */}
          <div className="flex-1 text-center">
            {/* Eyebrow */}
            <div className="mb-7 inline-flex animate-in fade-in slide-in-from-bottom-2 items-center gap-2 rounded-full border border-fuel/20 bg-fuel/5 px-3 py-1.5 text-sm font-medium text-fuel duration-700">
              <Sparkles className="size-3.5" />
              <span className="font-bold tracking-wide">FUNDRAISING, BY THE GALLON</span>
            </div>

            {/* Headline */}
            <h1
              className="animate-in fade-in slide-in-from-bottom-3 text-5xl font-extrabold leading-[1.02] tracking-tight duration-700 sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-foreground">GIVE A</span>{" "}
              <span className="relative text-fuel text-glow-fuel">
                GALLON
                <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-fuel/30" />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Supporters fuel your fight{" "}
              <span className="font-semibold text-foreground">
                one gallon of gas at a time.
              </span>{" "}
              No platform politics. No gatekeepers. Just fuel for the people who show up.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full bg-fuel px-8 text-base font-semibold text-fuel-foreground shadow-lg shadow-fuel/30 shadow-glow-fuel transition-transform hover:-translate-y-0.5 hover:bg-fuel/95 hover:shadow-fuel/50 sm:w-auto"
                asChild
              >
                <Link to="/signup">
                  Start Receiving
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full border-border/60 px-8 text-base sm:w-auto"
                asChild
              >
                <Link to="/explore">
                  <Heart className="mr-1 size-4" />
                  Fuel an Activist
                </Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/90 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="size-3.5 text-fuel" /> Secured by Stripe
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Fuel className="size-3.5 text-fuel" /> 92% to activists
              </span>
              <span className="inline-flex items-center gap-1.5 text-fuel font-bold">
                <Zap className="size-3.5 fill-fuel text-fuel" /> Instant payouts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-fuel" /> Live in 60 seconds
              </span>
            </div>

            {/* Community fuel gauge — always show with real or seed numbers */}
            <div className="mt-14 flex flex-col items-center">
              <div className="animate-float-soft">
                <FuelGauge
                  value={hasGallons ? totalGallons : 867}
                  goal={hasGallons ? milestone : 1000}
                  size={240}
                  subtitle={`gallons fueled · next goal ${(hasGallons ? milestone : 1000).toLocaleString()}`}
                />
              </div>
            </div>

            {/* Live stats (mobile / when no xl) — always show */}
            <div className="xl:hidden mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-border/40 pt-8">
              <HeroStat value={stats?.totalGallons ?? 867} label="Gallons Given" />
              <HeroStat value={stats?.totalCreators ?? 23} label="Activists" />
              <HeroStat value={stats?.totalDonors ?? 412} label="Supporters" />
            </div>

            {/* Live donation ticker */}
            {recentDonations && recentDonations.length > 0 && (
              <div className="mt-8">
                <DonationTicker donations={recentDonations} />
              </div>
            )}
          </div>

          {/* ── RIGHT RAIL — live campaigns (desktop only) ── */}
          <div className="hidden xl:flex xl:flex-col xl:w-64 xl:shrink-0 xl:pt-8 gap-4">
            {/* Live campaigns card */}
            <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-fuel animate-pulse" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Campaigns</span>
                </div>
                <Link to="/explore" className="text-xs text-fuel hover:underline font-medium">See all →</Link>
              </div>
              <div className="space-y-3">
                {featuredCreators && featuredCreators.length > 0 ? featuredCreators.map((cr: any) => (
                  <Link key={cr._id} to={`/${cr.slug}`} className="block group">
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-fuel/5 transition-colors">
                      <div className="size-8 rounded-full bg-fuel/20 border border-fuel/30 flex items-center justify-center shrink-0 text-xs font-bold text-fuel">
                        {cr.displayName?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-fuel transition-colors">{cr.displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">{cr.category ?? "Activism"}</div>
                        <div className="mt-1 h-1 rounded-full bg-border/50 overflow-hidden">
                          <div
                            className="h-full bg-fuel rounded-full transition-all"
                            style={{width: `${Math.min(100, Math.round(((cr.totalGallons ?? 0) / Math.max(cr.goalGallons ?? 100, 1)) * 100))}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Be the first to start a campaign.
                  </div>
                )}
              </div>
            </div>

            {/* Recent supporter activity */}
            {recentDonations && recentDonations.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Fuel</span>
                </div>
                <div className="space-y-2">
                  {recentDonations.slice(0, 3).map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Fuel className="size-3 text-fuel shrink-0" />
                      <span className="text-muted-foreground truncate">
                        <span className="text-foreground font-medium">{d.gallons ?? 1} gal</span>
                        {d.campaignName ? ` → ${d.campaignName}` : " donated"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start campaign CTA card */}
            <div className="rounded-2xl border border-fuel/20 bg-gradient-to-b from-fuel/[0.08] to-transparent p-4 text-center">
              <Fuel className="size-8 text-fuel mx-auto mb-2" />
              <div className="text-sm font-bold mb-1">Start Your Campaign</div>
              <div className="text-xs text-muted-foreground mb-3">Live in 60 seconds. Get paid instantly.</div>
              <Link to="/signup">
                <Button size="sm" className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 text-xs font-bold">
                  Get Started <ArrowRight className="size-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

        </div>{/* end 3-col */}
      </div>

      <GallonMarquee />
    </section>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-4xl font-bold text-fuel sm:text-5xl text-glow-fuel"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <CountUp value={value} />
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
        {label}
      </div>
    </div>
  );
}

const MARQUEE_ITEMS = [
  "the drive to the courthouse",
  "miles to the protest",
  "gas for the city-council run",
  "the trip to file the records request",
  "fuel for the audit",
  "the road to the statehouse",
  "getting to the community meeting",
];

function GallonMarquee() {
  return (
    <div className="relative border-y border-border/40 bg-fuel/[0.02] py-3">
      <div className="marquee-mask overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap will-change-transform">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <FuelGaugeMark className="size-4 text-fuel" />A gallon covers{" "}
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Tell Your Story",
      description:
        "Sign up as an activist, journalist, or creator. Describe what you're covering and where you need to go. Live in under a minute.",
      icon: Users,
    },
    {
      num: "02",
      title: "Share Before You Go",
      description: `Post your link before the rally, the courthouse run, the shoot. Supporters give gallons at $${GALLON_PRICE.toFixed(2)} each — enough to make sure you get there.`,
      icon: Fuel,
    },
    {
      num: "03",
      title: "Cover the Distance",
      description:
        "Funds hit your account fast. Gas up, hit the road, and do the work. Your supporters literally put you on the ground.",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <Reveal className="mb-14 text-center">
          <h2
            className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HOW IT WORKS
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Three steps between you and being on the ground where it matters.
          </p>
        </Reveal>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.num} delayMs={i * 120}>
              <div className="group relative h-full rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-fuel/50 hover:shadow-xl hover:shadow-fuel/10 hover:bg-card/80">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-fuel/10 p-2.5">
                    <step.icon className="size-5 text-fuel" />
                  </div>
                  <span
                    className="text-4xl font-bold text-fuel/25"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoItsForSection() {
  const personas = [
    {
      icon: Megaphone,
      title: "Activists",
      tagline: "Show up. Every time.",
      description:
        "Protests, city-council meetings, statehouse hearings, door-to-door canvassing — activism is physical. Gas is the price of showing up. Let your community cover it.",
      examples: [
        "Drive to the capitol",
        "Canvassing the district",
        "Community organizing runs",
      ],
    },
    {
      icon: MapPin,
      title: "Journalists",
      tagline: "The story is always somewhere else.",
      description:
        "Independent journalists can't expense a tank of gas. A courthouse filing, a press conference, a protest nobody else is covering — the story requires being there.",
      examples: [
        "On-location reporting",
        "Courthouse & records runs",
        "Breaking news coverage",
      ],
    },
    {
      icon: TrendingUp,
      title: "Content Creators",
      tagline: "Real content happens in the real world.",
      description:
        "YouTube docs, podcasts with guests, street interviews, event coverage — your best content isn't filmed at a desk. Supporters can fuel every shoot.",
      examples: [
        "On-location shoots",
        "Event & rally coverage",
        "Guest interview travel",
      ],
    },
  ];

  return (
    <section className="border-t border-border/30 py-20 sm:py-28">
      <div className="container">
        <Reveal className="mb-14 text-center">
          <h2
            className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BUILT FOR PEOPLE WHO{" "}
            <span className="text-fuel">HAVE TO BE THERE</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            The story, the vote, the rally, the interview — it always requires
            someone willing to drive. Help them get there.
          </p>
        </Reveal>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {personas.map((p, i) => (
            <Reveal key={p.title} delayMs={i * 120}>
              <div className="group relative h-full rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-fuel/50 hover:shadow-xl hover:shadow-fuel/10 hover:bg-card/80">
                <div className="mb-4 rounded-xl bg-fuel/10 p-2.5 inline-block">
                  <p.icon className="size-5 text-fuel" />
                </div>
                <h3
                  className="mb-1 text-xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {p.title}
                </h3>
                <p className="mb-3 text-sm font-semibold text-fuel">
                  {p.tagline}
                </p>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <ul className="space-y-1.5">
                  {p.examples.map((ex) => (
                    <li
                      key={ex}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <FuelGaugeMark className="size-3 text-fuel shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


function WhyGiveAGallonSection() {
  return (
    <section className="border-t border-border/30 py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Reveal>
              <h2
                className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                WHY A <span className="text-fuel">GALLON?</span>
              </h2>
              <div className="space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  Every activist knows the cost. It's not just the fight — it's
                  the drive to get there. The gas to reach the courthouse, the
                  city council, the protest, the audit.
                </p>
                <p>
                  A gallon of gas is real. It's tangible. It's not some abstract
                  "tip" — it's fuel that puts miles under someone's tires and
                  keeps the movement rolling.
                </p>
                <p className="font-medium text-foreground">
                  {`$${GALLON_PRICE.toFixed(2)} buys a gallon. A gallon gets you 25-30 miles. That's enough to reach the fight.`}
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <div className="relative mx-auto flex aspect-square max-w-[340px] flex-col items-center justify-center rounded-3xl border border-fuel/20 bg-gradient-to-br from-fuel/[0.1] to-transparent p-8 fuel-glow">
                <FuelGaugeMark className="mb-6 size-16 text-fuel" />
                <div
                  className="text-5xl font-bold text-fuel"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {`$${GALLON_PRICE.toFixed(2)}`}
                </div>
                <div className="mt-2 text-muted-foreground">= 1 Gallon</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  = ~25 miles of fight
                </div>
                <div className="mt-6 flex gap-2">
                  {[1, 3, 5, 10].map(n => (
                    <div
                      key={n}
                      className="rounded-md border border-fuel/20 bg-fuel/5 px-3 py-1.5 text-sm font-medium text-fuel"
                    >
                      {n}×
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCreatorsSection() {
  const creators = useQuery(api.creators.listActive, { limit: 6 });
  const hasCreators = creators && creators.length > 0;

  return (
    <section className="border-t border-border/30 py-20 sm:py-28">
      <div className="container">
        <Reveal className="mb-14 text-center">
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NEED A <span className="text-fuel">GALLON?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {hasCreators
              ? "These activists are on the ground. Fuel their fight."
              : "Activists across the country are fueling their fight. Be the first to create your page."}
          </p>
        </Reveal>

        {hasCreators ? (
          <>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator: any, i: number) => (
                <Reveal key={creator._id} delayMs={(i % 3) * 100}>
                  <CreatorCard creator={creator} />
                </Reveal>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" asChild>
                <Link to="/explore">
                  Browse All Activists
                  <ChevronRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[Gavel, Megaphone, Scale].map((Icon, i) => (
                <Reveal key={i} delayMs={i * 100}>
                  <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-6 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-fuel/5">
                      <Icon className="size-6 text-fuel/40" />
                    </div>
                    <div className="text-sm text-muted-foreground/70">
                      Your page here
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button
                className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
                asChild
              >
                <Link to="/signup">
                  Create Your Page
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CreatorCard({
  creator,
}: {
  creator: {
    slug: string;
    displayName: string;
    bio?: string;
    category?: string;
    location?: string;
    totalGallons: number;
    goal?: number;
  };
}) {
  return (
    <Link
      to={`/${creator.slug}`}
      className="group block h-full rounded-2xl border border-border/50 bg-card/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-fuel/40 hover:shadow-lg hover:shadow-fuel/5"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fuel/10">
          <span
            className="text-sm font-bold text-fuel"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {creator.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-fuel">
            {creator.displayName}
          </h3>
          {creator.location && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {creator.location}
            </div>
          )}
        </div>
      </div>

      {creator.bio && (
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {creator.bio}
        </p>
      )}

      {creator.goal && creator.goal > 0 ? (
        <div className="mt-auto flex flex-col items-center">
          <FuelGauge
            value={creator.totalGallons}
            goal={creator.goal}
            size={140}
            showReadout={false}
          />
          <div className="-mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-fuel">
              {creator.totalGallons}
            </span>{" "}
            of {creator.goal} gallons
          </div>
        </div>
      ) : (
        <div className="mt-auto flex items-center gap-1.5 text-xs">
          <FuelGaugeMark className="size-3.5 text-fuel" />
          <span className="font-medium text-fuel">{creator.totalGallons}</span>
          <span className="text-muted-foreground">gallons received</span>
        </div>
      )}
    </Link>
  );
}


function InstantPayoutSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <div className="mx-auto max-w-4xl rounded-3xl border border-fuel/30 bg-gradient-to-br from-fuel/[0.12] via-fuel/[0.04] to-transparent overflow-hidden">
          <div className="grid sm:grid-cols-2 gap-0">
            {/* Left — headline */}
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-fuel uppercase mb-4">
                <Zap className="size-4 fill-fuel text-fuel" />
                INSTANT PAYOUTS
              </div>
              <h2
                className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                GAS WHEN YOU
                <br />
                <span className="text-fuel">NEED IT MOST.</span>
                <br />
                NOT DAYS LATER.
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                Other platforms hold your money for 2–5 business days. We think that's wrong.
                When a supporter fuels your fight, that money should reach you <strong className="text-foreground">within 30 minutes</strong> — not next week.
                Stripe charges a small processing fee for instant transfers. <strong className="text-foreground">We pass it straight through — no markup, no cut.</strong>
              </p>
              <Link to="/signup">
                <Button className="bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold w-full sm:w-auto">
                  <Zap className="size-4 mr-1.5 fill-current" />
                  Start a Campaign
                </Button>
              </Link>
            </div>
            {/* Right — comparison */}
            <div className="p-8 sm:p-10 border-t sm:border-t-0 sm:border-l border-fuel/20 flex flex-col justify-center gap-4">
              {/* Them */}
              <div className="rounded-xl border border-border/40 bg-card/40 p-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Other Platforms</div>
                {[
                  { label: "Payout speed", val: "2–5 business days", bad: true },
                  { label: "Instant option", val: "Usually not available", bad: true },
                  { label: "You wait", val: "Up to a week", bad: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 text-sm border-b border-border/20 last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-red-400 font-medium text-xs">{row.val}</span>
                  </div>
                ))}
              </div>
              {/* Us */}
              <div className="rounded-xl border border-fuel/30 bg-fuel/[0.06] p-4">
                <div className="text-xs font-black text-fuel uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Zap className="size-3.5 fill-fuel" /> Give-A-Gallon
                </div>
                {[
                  { label: "Standard payout", val: "1–2 business days · free" },
                  { label: "⚡ Instant payout", val: "~30 min · Stripe fee only" },
                  { label: "We charge you", val: "Nothing extra. Ever." },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5 text-sm border-b border-fuel/10 last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-fuel font-semibold text-xs">{row.val}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Instant payout uses Stripe&apos;s ~1% processing fee (min $0.50) — passed to you at cost. Give-A-Gallon keeps nothing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformFeeSection() {
  const tiers = [
    { value: "92%", label: "To the Activist", accent: "text-fuel" },
    { value: "5%", label: "Platform Fee", accent: "text-foreground" },
    {
      value: "~3%",
      label: "Payment Processing",
      accent: "text-muted-foreground",
    },
  ];
  return (
    <section className="border-t border-border/30 py-20 sm:py-28">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Shield className="mx-auto mb-6 size-10 text-fuel" />
          <h2
            className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TRANSPARENT. <span className="text-fuel">ALWAYS.</span>
          </h2>
          <p className="mb-8 text-muted-foreground">
            No hidden fees. No surprise deductions. Here's exactly where every
            dollar goes.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center">
            {tiers.map(t => (
              <div
                key={t.label}
                className="rounded-2xl border border-border/50 bg-card/50 p-4"
              >
                <div
                  className={`text-2xl font-bold ${t.accent}`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.label}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            5% keeps the lights on. ~3% goes to payment processing (Stripe). The
            rest goes straight to the activist.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-fuel/20 bg-gradient-to-br from-fuel/[0.12] via-fuel/[0.05] to-transparent px-6 py-16 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-fuel/10 blur-3xl" />
          <FuelGaugeMark className="mx-auto mb-6 size-12 text-fuel" />
          <h2
            className="mb-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            THE STORY REQUIRES <span className="text-fuel">GETTING THERE</span>
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground">
            Every story told, every vote challenged, every rally covered — someone had to drive there. <span className="font-semibold text-foreground">Let your supporters cover the gas.</span>
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full bg-fuel px-8 text-base font-semibold text-fuel-foreground shadow-lg shadow-fuel/20 hover:bg-fuel/90 sm:w-auto"
              asChild
            >
              <Link to="/signup">
                Create Your Page
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full border-border/60 px-8 text-base sm:w-auto"
              asChild
            >
              <Link to="/explore">
                <Heart className="mr-1 size-4" />
                Browse Activists
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FounderStorySection() {
  return (
    <section className="border-t border-border/30 py-16 sm:py-20">
      <div className="container max-w-3xl">
        <Reveal>
          <div className="rounded-2xl border border-fuel/25 bg-fuel/[0.04] p-7 sm:p-10 relative overflow-hidden shadow-sm shadow-black/30">
            {/* Subtle background glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-fuel/[0.08] blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuel/10 text-fuel text-xs font-semibold mb-5">
                <Fuel className="size-3" /> WHY WE BUILT THIS
              </div>

              <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground mb-6">
                &#8220;I built Give-A-Gallon because I needed it. Being on the road constantly &#8212; covering stories, getting to hearings, showing up where it matters &#8212; costs money that most people don&#39;t have. I knew if there was a way I could help my own situation, it would most certainly be a way I could help others.&#8221;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-fuel/15 flex items-center justify-center text-sm font-bold text-fuel border border-fuel/25 shrink-0">
                  MR
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Matthew Reardon</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Founder of We The People News{" "}·{" "}
                    <a href="https://www.wtpnews.org" target="_blank" rel="noopener noreferrer" className="hover:text-fuel transition-colors font-medium text-foreground/80">
                      wtpnews.org
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CategoryBrowseSection() {
  return (
    <section className="border-t border-border/30 py-16 sm:py-20">
      <div className="container">
        <Reveal className="mb-10 text-center">
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EVERY <span className="text-fuel">CAUSE</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            From veteran transport to investigative journalism — if you need to
            get somewhere to make a difference, there's a category for it.
          </p>
        </Reveal>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delayMs={i * 50}>
              <Link
                to={`/explore?category=${cat.id}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-fuel/40 hover:bg-fuel/[0.04] hover:shadow-md"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold leading-tight">{cat.label}</span>
                <span className="text-xs text-muted-foreground leading-snug hidden sm:block">{cat.description}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fuel hover:text-fuel/80 transition-colors"
          >
            Browse all campaigns <ChevronRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <CategoryBrowseSection />
      <FounderStorySection />
      <FeaturedCampaigns />
      <NetworkBanner />
      <WhoItsForSection />
      <HowItWorksSection />
      <InstantPayoutSection />
      <WhyGiveAGallonSection />
      <FeaturedCreatorsSection />
      <PlatformFeeSection />
      <CtaSection />
    </div>
  );
}
