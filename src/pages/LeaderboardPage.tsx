import { useQuery } from "convex/react";
import { Fuel, Medal, Share2, TrendingUp, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

const MEDAL: Record<number, { emoji: string; color: string; bg: string }> = {
  1: {
    emoji: "🥇",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
  },
  2: {
    emoji: "🥈",
    color: "text-slate-300",
    bg: "bg-slate-300/10 border-slate-300/30",
  },
  3: {
    emoji: "🥉",
    color: "text-amber-600",
    bg: "bg-amber-600/10 border-amber-600/30",
  },
};

function shareLeaderboard() {
  const url = `${window.location.origin}/leaderboard`;
  const text =
    "⛽ See who's fueling the most activism on Give a Gallon — real people, real impact.";
  if (navigator.share) {
    navigator
      .share({ title: "Give a Gallon Leaderboard", text, url })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text} ${url}`);
  }
}

export function LeaderboardPage() {
  const top = useQuery(api.referrals.getReferralLeaderboard);
  const totalStats = useQuery(api.creators.getPlatformStats);

  const totalGallons = totalStats?.totalGallons ?? 0;
  const totalCreators = totalStats?.totalCreators ?? 0;
  const totalDonations = totalStats?.totalDonations ?? 0;

  return (
    <div className="min-h-screen">
      <div className="container py-10 max-w-3xl">
        {/* Header */}
        <Reveal className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-fuel/10 border border-fuel/20 mb-5">
            <Trophy className="size-8 text-fuel" />
          </div>
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            REFERRAL <span className="text-fuel">LEADERBOARD</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The activists fueling the most movement — ranked by gallons sent
            through referral links.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={shareLeaderboard}
          >
            <Share2 className="size-3.5 mr-1.5" /> Share Leaderboard
          </Button>
        </Reveal>

        {/* Platform stats bar */}
        <Reveal className="grid grid-cols-3 gap-3 mb-8">
          {[
            {
              icon: <Fuel className="size-4 text-fuel" />,
              value: totalGallons.toLocaleString(),
              label: "Total Gallons",
            },
            {
              icon: <Users className="size-4 text-fuel" />,
              value: totalCreators.toLocaleString(),
              label: "Campaigners",
            },
            {
              icon: <TrendingUp className="size-4 text-fuel" />,
              value: totalDonations.toLocaleString(),
              label: "Donations",
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card/50 py-4 px-2"
            >
              {stat.icon}
              <div
                className="text-2xl font-black text-fuel mt-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </Reveal>

        {/* Leaderboard list */}
        {!top ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-20 rounded-xl border border-border/30 bg-card/30 animate-pulse"
              />
            ))}
          </div>
        ) : top.length === 0 ? (
          <div className="text-center py-20">
            <Medal className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to share your referral link and climb the board.
            </p>
            <Button
              asChild
              className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
            >
              <Link to="/referrals">Get My Referral Link</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {top.map((entry, i) => {
              const rank = i + 1;
              const medal = MEDAL[rank];
              const maxGallons = top[0]?.referralGallons ?? 1;
              const barPct = Math.round(
                (entry.referralGallons / maxGallons) * 100,
              );

              return (
                <Reveal key={entry.slug}>
                  <Link
                    to={`/${entry.slug}`}
                    className={`group flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md hover:shadow-fuel/5 ${
                      medal
                        ? `${medal.bg} hover:border-fuel/40`
                        : "border-border/40 bg-card/40 hover:border-fuel/30"
                    }`}
                  >
                    {/* Rank */}
                    <div className="shrink-0 w-10 text-center">
                      {medal ? (
                        <span className="text-2xl">{medal.emoji}</span>
                      ) : (
                        <span className="text-lg font-black text-muted-foreground/50">
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar placeholder */}
                    <div className="shrink-0 size-11 rounded-full bg-fuel/10 border border-border/30 flex items-center justify-center">
                      <span
                        className="text-fuel font-black text-lg"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {entry.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-bold truncate group-hover:text-fuel transition-colors ${medal ? medal.color : ""}`}
                        >
                          {entry.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {entry.referralCount} donation
                          {entry.referralCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-fuel/70 transition-all duration-700"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Gallons */}
                    <div className="shrink-0 text-right">
                      <div
                        className="text-xl font-black text-fuel"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {entry.referralGallons}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-none">
                        gal
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <Reveal className="mt-10 rounded-2xl border border-fuel/20 bg-fuel/5 p-6 text-center">
          <h3
            className="font-black text-lg mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Want to climb the board?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share your referral link. Every gallon someone sends through your
            link counts toward your rank.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold"
              asChild
            >
              <Link to="/referrals">
                <Fuel className="size-4 mr-1.5" /> Get My Referral Link
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/explore">Explore Campaigns</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
