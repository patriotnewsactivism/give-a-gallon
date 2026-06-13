import { useQuery } from "convex/react";
import {
  ArrowRight,
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
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { GALLON_PRICE } from "@/lib/constants";
import { api } from "../../convex/_generated/api";

function HeroSection() {
  const stats = useQuery(api.donations.platformStats);
  const recentDonations = useQuery(api.donations.getRecent, { limit: 6 });
  const totalGallons = stats?.totalGallons ?? 0;
  const milestone = Math.max(1000, Math.ceil((totalGallons + 1) / 1000) * 1000);
  const hasGallons = totalGallons > 0;

  return (
    <section className="relative overflow-hidden">
      {/* Layered background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-fuel/[0.07] via-transparent to-transparent" />
        <div className="absolute -top-24 left-1/2 h-[640px] w-[900px] -translate-x-1/2 rounded-full bg-fuel/[0.06] blur-3xl" />
        <div className="absolute top-40 right-[12%] h-72 w-72 rounded-full bg-fuel/[0.05] blur-3xl" />
      </div>

      <div className="container relative pt-16 pb-16 sm:pt-24 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="mb-7 inline-flex animate-in fade-in slide-in-from-bottom-2 items-center gap-2 rounded-full border border-fuel/20 bg-fuel/5 px-3 py-1.5 text-sm font-medium text-fuel duration-700">
            <Sparkles className="size-3.5" />
            <span>Fundraising, by the gallon</span>
          </div>

          {/* Headline */}
          <h1
            className="animate-in fade-in slide-in-from-bottom-3 text-5xl font-extrabold leading-[1.02] tracking-tight duration-700 sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-foreground">GIVE A</span>{" "}
            <span className="relative text-fuel">
              GALLON
              <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-fuel/30" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            The fundraising platform built for activists. Supporters fuel your
            fight{" "}
            <span className="font-semibold text-foreground">
              one gallon of gas at a time
            </span>{" "}
            — because a gallon goes a long way when you're on the move.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full bg-fuel px-8 text-base font-semibold text-fuel-foreground shadow-lg shadow-fuel/20 transition-transform hover:translate-y-px hover:bg-fuel/90 sm:w-auto"
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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="size-3.5 text-fuel" /> Secured by Stripe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="size-3.5 text-fuel" /> 92% to activists
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-fuel" /> Live in 60 seconds
            </span>
          </div>

          {/* Community fuel gauge */}
          {hasGallons && (
            <div className="mt-14 flex flex-col items-center">
              <div className="animate-float-soft">
                <FuelGauge
                  value={totalGallons}
                  goal={milestone}
                  size={260}
                  subtitle={`gallons fueled · next goal ${milestone.toLocaleString()}`}
                />
              </div>
            </div>
          )}

          {/* Live stats */}
          {stats && hasGallons && (
            <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-border/40 pt-8">
              <HeroStat value={stats.totalGallons} label="Gallons Given" />
              <HeroStat value={stats.totalCreators} label="Activists" />
              <HeroStat value={stats.totalDonations} label="Donations" />
            </div>
          )}

          {/* Live donation ticker */}
          {recentDonations && recentDonations.length > 0 && (
            <div className="mt-8">
              <DonationTicker donations={recentDonations} />
            </div>
          )}
        </div>
      </div>

      <GallonMarquee />
    </section>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl font-bold text-fuel sm:text-4xl"
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
      title: "Create Your Page",
      description:
        "Sign up, add your cause, set your gallon goal. Your page is live in under a minute.",
      icon: Users,
    },
    {
      num: "02",
      title: "Share Your Link",
      description: `Supporters visit and give gallons at $${GALLON_PRICE.toFixed(2)} each. Pick 1, 5, 10, or go custom.`,
      icon: Fuel,
    },
    {
      num: "03",
      title: "Fuel Your Fight",
      description:
        "Funds hit your account. Use it for gas, travel, supplies — whatever keeps you moving.",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <Reveal className="mb-14 text-center">
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HOW IT WORKS
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Three steps. No complexity. Get funded and get moving.
          </p>
        </Reveal>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.num} delayMs={i * 120}>
              <div className="group relative h-full rounded-2xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-fuel/40 hover:shadow-lg hover:shadow-fuel/5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-fuel/10 p-2.5">
                    <step.icon className="size-5 text-fuel" />
                  </div>
                  <span
                    className="text-4xl font-bold text-fuel/15"
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
            A GALLON GOES <span className="text-fuel">A LONG WAY</span>
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground">
            Whether you're on the front lines or supporting from home — every
            gallon counts.
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

export function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <WhyGiveAGallonSection />
      <FeaturedCreatorsSection />
      <PlatformFeeSection />
      <CtaSection />
    </div>
  );
}
