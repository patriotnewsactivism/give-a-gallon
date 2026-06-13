import { useQuery } from "convex/react";
import {
  ArrowRight,
  ChevronRight,
  Fuel,
  Heart,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { GALLON_PRICE } from "@/lib/constants";

function GallonIcon({ className }: { className?: string }) {
  return <Fuel className={className} />;
}

function HeroSection() {
  const stats = useQuery(api.donations.platformStats);

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-fuel/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-fuel/[0.04] rounded-full blur-3xl" />

      <div className="container relative pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-fuel/20 bg-fuel/5 text-fuel text-sm font-medium mb-8">
            <Fuel className="size-3.5" />
            <span>Fuel the Movement</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-foreground">GIVE A</span>
            <br />
            <span className="text-fuel">GALLON</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            The fundraising platform built for activists. One gallon of gas at a
            time. Because a gallon goes a long way when you're fighting for what
            matters.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-fuel text-fuel-foreground hover:bg-fuel/90 text-base px-8 h-12 font-semibold"
              asChild
            >
              <Link to="/signup">
                Start Receiving
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border/50 text-base px-8 h-12"
              asChild
            >
              <Link to="/explore">
                Give a Gallon
                <GallonIcon className="size-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Stats bar */}
          {stats && stats.totalGallons > 0 && (
            <div className="flex items-center justify-center gap-6 sm:gap-10 mt-14 pt-8 border-t border-border/30">
              <StatItem
                value={stats.totalGallons.toLocaleString()}
                label="Gallons Given"
              />
              <StatItem
                value={stats.totalCreators.toLocaleString()}
                label="Activists"
              />
              <StatItem
                value={stats.totalDonations.toLocaleString()}
                label="Donations"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-2xl sm:text-3xl font-bold text-fuel"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
        {label}
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
      description: `Supporters visit your page and give gallons at $${GALLON_PRICE.toFixed(2)} each. Pick 1, 5, 10, or go custom.`,
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
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HOW IT WORKS
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Three steps. No complexity. Get funded and get moving.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative group p-6 rounded-xl border border-border/50 bg-card/50 hover:border-fuel/30 hover:bg-fuel/[0.02] transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <span
                  className="text-3xl font-bold text-fuel/30"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.num}
                </span>
                <div className="p-2 rounded-lg bg-fuel/10">
                  <step.icon className="size-5 text-fuel" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyGiveAGallonSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/30">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                WHY A <span className="text-fuel">GALLON?</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
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
                <p className="text-foreground font-medium">
                  {`$${GALLON_PRICE.toFixed(2)} buys a gallon. A gallon gets you 25-30 miles. That's enough to reach the fight.`}
                </p>
              </div>
            </div>

            {/* Right — visual */}
            <div className="relative">
              <div className="aspect-square max-w-[320px] mx-auto rounded-2xl border border-fuel/20 bg-gradient-to-br from-fuel/[0.08] to-transparent p-8 flex flex-col items-center justify-center">
                <Fuel className="size-16 text-fuel mb-6" strokeWidth={1.5} />
                <div
                  className="text-5xl font-bold text-fuel"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {`$${GALLON_PRICE.toFixed(2)}`}
                </div>
                <div className="text-muted-foreground mt-2">=  1 Gallon</div>
                <div className="text-muted-foreground text-sm mt-1">
                  = ~25 miles of fight
                </div>
                <div className="mt-6 flex gap-2">
                  {[1, 3, 5, 10].map((n) => (
                    <div
                      key={n}
                      className="px-3 py-1.5 rounded-md border border-fuel/20 bg-fuel/5 text-fuel text-sm font-medium"
                    >
                      {n}×
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCreatorsSection() {
  const creators = useQuery(api.creators.listActive, { limit: 6 });

  if (!creators || creators.length === 0) {
    // Show placeholder cards when no creators yet
    return (
      <section className="py-20 sm:py-28 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NEED A <span className="text-fuel">GALLON?</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Activists across the country are fueling their fight. Be the first
              to create your page.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-dashed border-border/50 bg-card/30 p-6 text-center"
              >
                <div className="size-14 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                  <Users className="size-6 text-muted-foreground/50" />
                </div>
                <div className="text-sm text-muted-foreground/60">
                  Your page here
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
              asChild
            >
              <Link to="/signup">
                Create Your Page
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-28 border-t border-border/30">
      <div className="container">
        <div className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NEED A <span className="text-fuel">GALLON?</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            These activists are on the ground. Fuel their fight.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {creators.map((creator: any) => (
            <CreatorCard key={creator._id} creator={creator} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" asChild>
            <Link to="/explore">
              Browse All Activists
              <ChevronRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
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
  const fillPct =
    creator.goal && creator.goal > 0
      ? Math.min((creator.totalGallons / creator.goal) * 100, 100)
      : 0;

  return (
    <Link
      to={`/${creator.slug}`}
      className="group rounded-xl border border-border/50 bg-card/50 hover:border-fuel/30 hover:bg-fuel/[0.02] transition-all duration-300 p-5 block"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="size-10 rounded-full bg-fuel/10 flex items-center justify-center shrink-0">
          <span
            className="text-fuel font-bold text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {creator.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-fuel transition-colors">
            {creator.displayName}
          </h3>
          {creator.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="size-3" />
              {creator.location}
            </div>
          )}
        </div>
      </div>

      {creator.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {creator.bio}
        </p>
      )}

      {/* Fuel gauge */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-fuel font-medium">
            {creator.totalGallons} gallons
          </span>
          {creator.goal && (
            <span className="text-muted-foreground">
              of {creator.goal} goal
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-fuel transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function PlatformFeeSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="size-10 text-fuel mx-auto mb-6" />
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TRANSPARENT. <span className="text-fuel">ALWAYS.</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            No hidden fees. No surprise deductions. Here's exactly where every
            dollar goes.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div
                className="text-2xl font-bold text-fuel"
                style={{ fontFamily: "var(--font-display)" }}
              >
                92%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                To the Activist
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div
                className="text-2xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                5%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Platform Fee
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div
                className="text-2xl font-bold text-muted-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ~3%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Payment Processing
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            5% keeps the lights on. ~3% goes to payment processing (Stripe).
            The rest goes straight to the activist.
          </p>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            A GALLON GOES
            <br />
            <span className="text-fuel">A LONG WAY</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Whether you're on the front lines or supporting from home — every
            gallon counts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-fuel text-fuel-foreground hover:bg-fuel/90 text-base px-8 h-12 font-semibold"
              asChild
            >
              <Link to="/signup">
                Create Your Page
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border/50 text-base px-8 h-12"
              asChild
            >
              <Link to="/explore">
                <Heart className="size-4 mr-1" />
                Browse Activists
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/30 py-8">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Give a Gallon. Fuel the movement.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <WhyGiveAGallonSection />
      <FeaturedCreatorsSection />
      <PlatformFeeSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
