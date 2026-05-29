import { useQuery } from "convex/react";
import {
  Copy,
  ExternalLink,
  Fuel,
  Heart,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GALLON_PRICE } from "@/lib/constants";

export function DashboardPage() {
  const creator = useQuery(api.creators.getMine);
  const donations = useQuery(
    api.donations.listForCreator,
    creator ? { creatorId: creator._id, limit: 50 } : "skip"
  );

  // If no creator profile yet, show setup prompt
  if (creator === null) {
    return <SetupPrompt />;
  }

  if (creator === undefined) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/${creator.slug}`;
  const fillPct =
    creator.goal && creator.goal > 0
      ? Math.min((creator.totalGallons / creator.goal) * 100, 100)
      : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            YOUR TANK
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your gallons and supporters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(profileUrl);
              toast.success("Profile link copied!");
            }}
          >
            <Copy className="size-3.5 mr-1" />
            Copy Link
          </Button>
          <Button
            size="sm"
            className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
            asChild
          >
            <Link to={`/${creator.slug}`} target="_blank">
              <ExternalLink className="size-3.5 mr-1" />
              View Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Fuel className="size-5" />}
          label="Total Gallons"
          value={creator.totalGallons.toString()}
          accent
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Total Raised"
          value={`$${(creator.totalAmountCents / 100).toFixed(2)}`}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Supporters"
          value={creator.totalDonations.toString()}
        />
      </div>

      {/* Fuel gauge */}
      {creator.goal && creator.goal > 0 && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Goal Progress</span>
            <span className="text-sm text-fuel font-semibold">
              {creator.totalGallons} / {creator.goal} gallons
            </span>
          </div>
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuel/70 to-fuel transition-all duration-700"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            {Math.round(fillPct)}% — $
            {(creator.totalGallons * GALLON_PRICE).toFixed(2)} of $
            {(creator.goal * GALLON_PRICE).toFixed(2)}
          </div>
        </div>
      )}

      {/* Share your link */}
      <div className="p-4 rounded-xl border border-fuel/20 bg-fuel/[0.03]">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Heart className="size-4 text-fuel" />
          Share your link
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-background px-3 py-2 rounded-lg border border-border/50 text-fuel truncate">
            {profileUrl}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(profileUrl);
              toast.success("Copied!");
            }}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Recent donations */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Supporters</h2>
        {!donations || donations.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
            <Fuel className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No donations yet. Share your link to start receiving gallons!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {donations.map((d: any) => (
              <div
                key={d._id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/30"
              >
                <div className="size-8 rounded-full bg-fuel/10 flex items-center justify-center shrink-0">
                  <Fuel className="size-3.5 text-fuel" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{d.donorName}</span>
                    <span className="text-sm text-fuel font-semibold">
                      +{d.gallons} gal
                    </span>
                  </div>
                  {d.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                      <MessageSquare className="size-3 mt-0.5 shrink-0" />
                      {d.message}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground/60 mt-0.5">
                    ${(d.amountCents / 100).toFixed(2)} ·{" "}
                    {timeAgo(d.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SetupPrompt() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="size-16 rounded-full bg-fuel/10 mx-auto mb-6 flex items-center justify-center">
          <Fuel className="size-8 text-fuel" />
        </div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          SET UP YOUR PAGE
        </h2>
        <p className="text-muted-foreground mb-6">
          Create your activist profile to start receiving gallons from
          supporters.
        </p>
        <Button
          className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
          asChild
        >
          <Link to="/settings">Create Your Profile</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${accent ? "border-fuel/20 bg-fuel/[0.03]" : "border-border/50 bg-card/50"}`}
    >
      <div
        className={`mb-2 ${accent ? "text-fuel" : "text-muted-foreground"}`}
      >
        {icon}
      </div>
      <div
        className={`text-2xl font-bold ${accent ? "text-fuel" : ""}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function timeAgo(ts: number) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
