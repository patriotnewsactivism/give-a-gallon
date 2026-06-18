import { useQuery } from "convex/react";
import {
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Users,
  Fuel,
  TrendingUp,
<<<<<<< Updated upstream
  MapPin,
} from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { VERIFICATION_TIERS } from "@/lib/constants";
=======
} from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
>>>>>>> Stashed changes
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { setReferral } from "@/hooks/useReferral";

export default function FirmOnboardingPage() {
  const { slug } = useParams<{ slug: string }>();
  const creator = useQuery(api.creators.getBySlug, { slug: slug ?? "" });

  useEffect(() => {
    if (creator?.referralCode) {
      setReferral(creator.referralCode);
    }
  }, [creator?.referralCode]);

  if (creator === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-fuel border-t-transparent animate-spin" />
      </div>
    );
  }

  // If not found or not an organization, redirect to their profile or home
  if (!creator || creator.verificationStatus !== "organization") {
    return <Navigate to={creator ? `/${creator.slug}` : "/"} replace />;
  }

<<<<<<< Updated upstream
  const tier = VERIFICATION_TIERS.organization;

=======
>>>>>>> Stashed changes
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 size-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 size-[500px] rounded-full bg-fuel/5 blur-[120px]" />
      </div>

      <div className="container max-w-5xl flex-1 flex flex-col py-12 px-4">
        {/* Co-branding Header */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-12 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-2xl bg-card border border-border/40 flex items-center justify-center overflow-hidden shadow-xl">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="size-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
                  {creator.displayName.charAt(0)}
                </span>
              )}
            </div>
            <div className="size-6 text-muted-foreground/30 flex items-center justify-center">
              <Zap className="size-6 fill-current" />
            </div>
            <div className="size-20 rounded-2xl bg-fuel flex items-center justify-center shadow-xl shadow-fuel/20">
              <Fuel className="size-10 text-fuel-foreground" />
            </div>
          </div>
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="size-3" /> {creator.displayName} Network
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              START YOUR CAMPAIGN
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Join the {creator.displayName} network on Give-A-Gallon and get the fuel you need to keep fighting.
            </p>
          </div>
        </div>

        {/* Features / Why join */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Zap,
              title: "Instant Payouts",
              desc: "Donations arrive on your debit card in ~30 minutes via Stripe. No waiting for weekly payouts.",
              color: "text-amber-400"
            },
            {
              icon: Users,
              title: "Built-in Network",
              desc: `Joining through ${creator.displayName} gives your campaign immediate social proof and visibility.`,
              color: "text-blue-400"
            },
            {
              icon: TrendingUp,
              title: "Referral Bonus",
              desc: "Earn extra gallons for every donor you bring to the platform. We grow together.",
<<<<<<< Updated upstream
              color: "text-green-400"
=======
              color: "text-green- Green-400"
>>>>>>> Stashed changes
            }
          ].map((feature, i) => (
            <Card key={i} className="p-6 bg-card/40 border-border/40 space-y-3">
              <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center ${feature.color}`}>
                <feature.icon className="size-6" />
              </div>
              <h3 className="font-bold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-2xl font-bold">Ready to get fueled?</h2>
            <p className="text-muted-foreground">
              Setting up your campaign takes less than 5 minutes. Connect your Stripe account and start raising fuel for your mission today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button size="lg" className="flex-1 bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold text-lg h-14" asChild>
              <Link to="/signup">
                Create My Campaign <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="flex-1 h-14 font-bold" asChild>
              <Link to={`/${creator.slug}`}>
                View {creator.displayName}
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            By joining, you'll be part of the verified network of {creator.displayName}.
          </p>
        </div>

        {/* Trust signal */}
        <div className="mt-20 flex flex-col items-center gap-6">
          <div className="h-px w-24 bg-border/50" />
          <div className="flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              <span className="font-bold text-lg tracking-tight">STRIPE</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="size-5" />
              <span className="font-bold text-lg tracking-tight">VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
