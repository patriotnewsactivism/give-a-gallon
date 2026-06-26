import { useMutation, useQuery } from "convex/react";
import {
  Award,
  BarChart3,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Fuel,
  Gift,
  Share2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "../../convex/_generated/api";

const SITE_URL = "https://www.giveagallon.org";

// Simple bar chart component
function MiniBarChart({
  data,
}: {
  data: { month: string; gallons: number; donations: number }[];
}) {
  if (!data.length)
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No referral data yet — share your link to get started!
      </div>
    );
  const max = Math.max(...data.map(d => d.gallons), 1);
  return (
    <div className="flex items-end gap-2 h-32 px-1">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {d.gallons}g
          </span>
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-400 transition-all"
            style={{ height: `${Math.max((d.gallons / max) * 96, 4)}px` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// Rank badge
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

export default function ReferralPage() {
  const stats = useQuery(api.referrals.getMyReferralStats);
  const leaderboard = useQuery(api.referrals.getReferralLeaderboard);
  const generateCode = useMutation(api.referrals.getMyReferralCode);
  const updateCode = useMutation(api.referrals.updateReferralCode);

  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (stats?.referralCode) {
      setNewCode(stats.referralCode);
    }
  }, [stats?.referralCode]);

  const referralLink = stats?.referralCode
    ? `${SITE_URL}/?ref=${stats.referralCode}`
    : null;

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      await generateCode({});
      toast.success("Referral code generated!");
    } catch (_e) {
      toast.error("Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateCode = async () => {
    if (newCode.length < 3) {
      toast.error("Code must be at least 3 characters");
      return;
    }
    setUpdating(true);
    try {
      await updateCode({ code: newCode });
      toast.success("Referral code updated!");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update code");
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: "Help fuel independent journalism",
        text: "I'm raising fuel for independent journalism on Give-A-Gallon. Join me!",
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Gift className="size-6 text-amber-400" />
          <h1 className="text-2xl font-bold">Referral Program</h1>
        </div>
        <p className="text-muted-foreground">
          Share your link — earn bonus gallons for every friend who fuels a
          campaign.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          {
            icon: Share2,
            label: "Share your link",
            desc: "Copy and post it anywhere",
          },
          {
            icon: Users,
            label: "Friends donate",
            desc: "Anyone who uses your link",
          },
          {
            icon: Fuel,
            label: "You earn gallons",
            desc: "Credited to your campaign",
          },
        ].map(({ icon: Icon, label, desc }) => (
          <Card
            key={label}
            className="p-4 bg-card/60 border-border/40 space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto">
              <Icon className="size-5 text-amber-400" />
            </div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </Card>
        ))}
      </div>

      {/* Your referral link */}
      <Card className="p-6 bg-card/60 border-border/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-amber-400" />
            <h2 className="font-semibold text-lg">Your Referral Link</h2>
          </div>
          {referralLink && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-amber-400"
            >
              <Edit2 className="size-3" />
              Personalize
            </Button>
          )}
        </div>

        {referralLink ? (
          <div className="space-y-4">
            {isEditing ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    ?ref=
                  </span>
                  <Input
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    className="pl-12 font-mono text-sm h-10 uppercase"
                    placeholder="MY-CODE"
                    maxLength={20}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleUpdateCode}
                  disabled={updating || newCode === stats?.referralCode}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {updating ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setNewCode(stats?.referralCode ?? "");
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/40 rounded-lg px-4 py-2.5 font-mono text-sm truncate border border-border/40">
                  {referralLink}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <Check className="size-4 text-green-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleShare}
                  className="shrink-0 gap-1.5 bg-amber-500 hover:bg-amber-400 text-black"
                >
                  <Share2 className="size-4" />
                  Share
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You don't have a referral code yet. Generate one to start earning!
            </p>
            <Button
              onClick={handleGenerateCode}
              disabled={generating}
              className="gap-2 bg-amber-500 hover:bg-amber-400 text-black"
            >
              <Gift className="size-4" />
              {generating ? "Generating…" : "Generate My Referral Code"}
            </Button>
          </div>
        )}

        {stats?.referralCode && !isEditing && (
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://twitter.com/intent/tweet?text=Help+fuel+independent+journalism+%E2%9B%BD&url=${encodeURIComponent(referralLink!)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                variant="outline"
                className="gap-1 cursor-pointer hover:bg-muted"
              >
                <ExternalLink className="size-3" /> Share on X
              </Badge>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink!)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                variant="outline"
                className="gap-1 cursor-pointer hover:bg-muted"
              >
                <ExternalLink className="size-3" /> Share on Facebook
              </Badge>
            </a>
          </div>
        )}
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Friends Referred",
            value: stats?.referralCount ?? 0,
            icon: Users,
            color: "text-blue-400",
          },
          {
            label: "Donations Driven",
            value: stats?.totalDonations ?? 0,
            icon: BarChart3,
            color: "text-green-400",
          },
          {
            label: "Gallons Earned",
            value: `${stats?.referralGallons ?? 0}⛽`,
            icon: Fuel,
            color: "text-amber-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5 bg-card/60 border-border/40">
            <div className={`${color} mb-1`}>
              <Icon className="size-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {/* Monthly activity chart */}
      <Card className="p-6 bg-card/60 border-border/40 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-amber-400" />
          <h2 className="font-semibold">Monthly Referral Activity</h2>
        </div>
        <MiniBarChart data={stats?.monthlyData ?? []} />
      </Card>

      {/* Leaderboard */}
      <Card className="p-6 bg-card/60 border-border/40 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-400" />
          <h2 className="font-semibold">Top Referrers</h2>
          <Badge variant="secondary" className="ml-auto text-xs">
            All time
          </Badge>
        </div>

        {(leaderboard?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No referrals yet — be the first on the board! 🏆
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard?.map(entry => {
              const isMe = stats?.leaderboard?.find(
                l => l.isMe && l.rank === entry.rank,
              );
              return (
                <div
                  key={entry.slug}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isMe
                      ? "bg-amber-400/10 border border-amber-400/30"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <RankBadge rank={entry.rank} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {entry.displayName}
                      {isMe && (
                        <Badge className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 border-amber-400/30">
                          You
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.referralCount} referrals
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-400 text-sm">
                      {entry.referralGallons}⛽
                    </p>
                    <p className="text-[10px] text-muted-foreground">gallons</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-amber-400/5 border-amber-400/20 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-amber-400" />
          <h2 className="font-semibold text-amber-300">Pro Tips</h2>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            Pin your referral link in your bio on X, Instagram, or YouTube.
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            Share it at the end of your articles or videos with a call to
            action.
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            Every gallon your referrals donate counts toward your campaign
            total.
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5">✓</span>
            Top referrers get featured on the public leaderboard — social proof!
          </li>
        </ul>
      </Card>
    </div>
  );
}
