import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Fuel,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FuelGauge } from "@/components/FuelGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GALLON_PRICE } from "@/lib/constants";
import { api } from "../../convex/_generated/api";

export function DashboardPage() {
  const creator = useQuery(api.creators.getMine);
  const donations = useQuery(
    api.donations.listForCreator,
    creator ? { creatorId: creator._id, limit: 50 } : "skip",
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const connect = searchParams.get("connect");
    if (connect === "complete") {
      toast.success("PayPal account connected! You can now receive payouts.");
      setSearchParams({});
    } else if (connect === "refresh") {
      toast.info("Onboarding expired — click 'Connect PayPal' to restart.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // If no creator profile yet, show setup prompt
  if (creator === null) {
    return <SetupPrompt />;
  }

  if (creator === undefined) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/${creator.slug}`;

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
      {creator.goal && creator.goal > 0 ? (
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 flex flex-col sm:flex-row items-center sm:justify-center gap-6">
          <FuelGauge
            value={creator.totalGallons}
            goal={creator.goal}
            size={240}
          />
          <div className="text-center sm:text-left">
            <div className="text-sm font-medium">Goal progress</div>
            <div
              className="text-2xl font-bold text-fuel"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ${(creator.totalGallons * GALLON_PRICE).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              of ${(creator.goal * GALLON_PRICE).toFixed(2)} goal
            </div>
          </div>
        </div>
      ) : (
        <Link
          to="/settings"
          className="block p-4 rounded-xl border border-dashed border-fuel/30 bg-fuel/[0.02] text-center text-sm text-muted-foreground hover:bg-fuel/[0.04] transition-colors"
        >
          Set a gallon goal to light up your fuel gauge →
        </Link>
      )}

      {/* Post update */}
      <PostUpdatePanel />

      {/* Payout panel */}
      <PayoutPanel creator={creator} />

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
                    ${(d.amountCents / 100).toFixed(2)} · {timeAgo(d.createdAt)}
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

function PostUpdatePanel() {
  const postUpdate = useMutation(api.updates.create);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [impactTag, setImpactTag] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePost() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await postUpdate({
        title: title.trim(),
        body: body.trim(),
        impactTag: impactTag.trim() || undefined,
      });
      toast.success("Update posted!");
      setTitle("");
      setBody("");
      setImpactTag("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to post update");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 p-4 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:border-fuel/40 hover:text-foreground hover:bg-fuel/[0.02] transition-all text-sm"
      >
        <Plus className="size-4 text-fuel" />
        Post a campaign update…
      </button>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-fuel/20 bg-card/50 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Plus className="size-4 text-fuel" /> New Update
      </h3>
      <Input
        placeholder="Update title (e.g. 'Records filed!')"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="bg-background border-border/50 text-sm"
      />
      <Textarea
        placeholder="Tell supporters what happened. Be specific — what did the fuel make possible?"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        className="bg-background border-border/50 text-sm resize-none"
      />
      <Input
        placeholder="Impact tag (optional — e.g. 'Records request filed', 'Case won')"
        value={impactTag}
        onChange={e => setImpactTag(e.target.value)}
        className="bg-background border-border/50 text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-fuel text-fuel-foreground hover:bg-fuel/90"
          onClick={handlePost}
          disabled={saving || !title.trim() || !body.trim()}
        >
          {saving ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="size-3.5 mr-1.5" />
          )}
          Post Update
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PayoutPanel({ creator }: { creator: any }) {
  const startOnboarding = useAction(api.paypalConnect.startOnboarding);
  const getBalance = useAction(api.paypalConnect.getBalance);
  const requestPayout = useAction(api.paypalConnect.requestPayout);

  const [loading, setLoading] = useState(false);
  const [paypalEmailInput, setPaypalEmailInput] = useState("");
  const [payoutResult, setPayoutResult] = useState<{
    payoutId: string;
    feeCents: number;
    netCents: number;
    method: string;
  } | null>(null);
  const [balance, setBalance] = useState<{
    availableCents: number;
    pendingCents: number;
    accountStatus: string;
  } | null>(null);

  const status = creator.stripeAccountStatus ?? "not_connected";

  useEffect(() => {
    if (status === "active") {
      getBalance().then(setBalance).catch(console.error);
    }
  }, [status, getBalance]);

  async function handleConnect() {
    if (!paypalEmailInput.trim()) {
      toast.error("Please enter a valid PayPal email address");
      return;
    }
    setLoading(true);
    try {
      await startOnboarding({ paypalEmail: paypalEmailInput.trim() });
      toast.success("PayPal account connected successfully!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start onboarding");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayout(instant: boolean) {
    if (!balance || balance.availableCents < 100) {
      toast.error("No available balance to pay out");
      return;
    }
    setLoading(true);
    setPayoutResult(null);
    try {
      const result = await requestPayout({
        amountCents: balance.availableCents,
        instant,
      });
      setPayoutResult(result);
      toast.success(
        instant
          ? `⚡ $${(result.netCents / 100).toFixed(2)} on its way — hits your card in ~30 min!`
          : `Payout initiated — $${(result.netCents / 100).toFixed(2)} arrives in 1–2 business days.`,
      );
      const updated = await getBalance();
      setBalance(updated);
    } catch (e: any) {
      toast.error(e.message ?? "Payout failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Not connected yet ──
  if (status === "not_connected") {
    return (
      <div className="rounded-xl border border-fuel/30 bg-fuel/[0.04] overflow-hidden">
        {/* Instant payout hero banner */}
        <div className="bg-gradient-to-r from-fuel/20 to-fuel/5 px-5 py-4 border-b border-fuel/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="size-4 text-fuel fill-fuel" />
            <span className="text-xs font-black tracking-widest text-fuel uppercase">
              Instant Payouts Available
            </span>
          </div>
          <p className="text-sm font-semibold">
            Get your money in <span className="text-fuel">~30 minutes.</span>{" "}
            Not days.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Other platforms make you wait 2–5 days. We don't. Gas when you need
            it — <em>now.</em>
          </p>
        </div>
        <div className="p-5">
          <h3 className="font-semibold mb-3">Connect PayPal to Get Paid</h3>
          <ul className="space-y-1.5 mb-4">
            {[
              {
                icon: "⚡",
                text: "Instant payout — ~30 min to your debit card (1.5% fee, min $0.50)",
              },
              {
                icon: "🏦",
                text: "Standard payout — 1–2 business days, no fee",
              },
              {
                icon: "🔒",
                text: "Quick KYC — name, DOB, SSN last-4, debit card",
              },
              { icon: "💸", text: "Donations route straight to your account" },
            ].map(item => (
              <li
                key={item.text}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="shrink-0 mt-px">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 mb-4">
            <label
              htmlFor="paypal-email"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              PayPal Email Address
            </label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="your-paypal-email@example.com"
              value={paypalEmailInput}
              onChange={e => setPaypalEmailInput(e.target.value)}
              className="bg-card text-sm"
              required
            />
          </div>
          <Button
            className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Zap className="size-4 mr-2" />
            )}
            Connect PayPal — Start Getting Paid
          </Button>
        </div>
      </div>
    );
  }

  // ── Pending KYC ──
  if (status === "pending") {
    return (
      <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04]">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-yellow-500/10 p-2.5 shrink-0">
            <Clock className="size-5 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Almost There — Finish Setup</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Complete your PayPal onboarding to unlock payouts — including
              instant.
            </p>
            <p className="text-xs text-fuel font-medium mb-4">
              ⚡ Instant payouts unlock once verified.
            </p>
            <Button
              variant="outline"
              className="border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <ArrowDownToLine className="size-4 mr-2" />
              )}
              Resume Onboarding
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Restricted ──
  if (status === "restricted") {
    return (
      <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.04]">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-500/10 p-2.5 shrink-0">
            <AlertCircle className="size-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Action Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              PayPal needs more information before enabling payouts on your
              account.
            </p>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-600 hover:bg-red-500/10"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Resolve with PayPal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active — full payout UI ──
  const available = balance?.availableCents ?? 0;
  const pending = balance?.pendingCents ?? 0;
  const canPayout = available >= 100;

  // Instant fee preview: 1.5%, min $0.50, max $10
  const instantFeeCents = canPayout
    ? Math.min(1000, Math.max(50, Math.round(available * 0.015)))
    : 50;
  const instantNetCents = available - instantFeeCents;

  return (
    <div className="rounded-xl border border-fuel/20 bg-fuel/[0.03] overflow-hidden">
      {/* Balance header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-xl bg-fuel/10 p-2 shrink-0">
            <Wallet className="size-4 text-fuel" />
          </div>
          <h3 className="font-semibold">Your Balance</h3>
          <span className="ml-auto flex items-center gap-1 text-xs text-fuel font-medium">
            <CheckCircle2 className="size-3.5" /> Connected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-fuel/20 bg-fuel/[0.08] p-3 text-center">
            <div
              className="text-2xl font-bold text-fuel"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ${(available / 100).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Available
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/50 p-3 text-center">
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ${(pending / 100).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
          </div>
        </div>
      </div>

      {/* ⚡ INSTANT PAYOUT — hero option */}
      <div className="p-4 border-b border-border/20 bg-gradient-to-r from-fuel/10 to-transparent">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="size-3.5 text-fuel fill-fuel" />
          <span className="text-xs font-black tracking-wider text-fuel uppercase">
            Instant Payout
          </span>
          <span className="ml-auto text-xs text-muted-foreground">~30 min</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Money on your debit card in about 30 minutes. No waiting days.
          {canPayout && (
            <span className="text-foreground/70">
              {" "}
              Stripe charges{" "}
              <strong>${(instantFeeCents / 100).toFixed(2)}</strong> to process
              instantly — you receive{" "}
              <strong className="text-fuel">
                ${(instantNetCents / 100).toFixed(2)}
              </strong>
              . We keep nothing.
            </span>
          )}
        </p>
        <Button
          className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold"
          onClick={() => handlePayout(true)}
          disabled={!canPayout || loading}
        >
          {loading ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Zap className="size-4 mr-1.5 fill-current" />
          )}
          {canPayout
            ? `⚡ Get $${(instantNetCents / 100).toFixed(2)} Now`
            : "⚡ Instant Payout"}
        </Button>
      </div>

      {/* Standard payout — secondary option */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Standard Payout
          </span>
          <span className="text-xs text-muted-foreground">
            1–2 business days · free
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handlePayout(false)}
          disabled={!canPayout || loading}
        >
          {loading ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <ArrowDownToLine className="size-4 mr-1.5" />
          )}
          {canPayout
            ? `Transfer $${(available / 100).toFixed(2)} to Bank`
            : "Transfer to Bank"}
        </Button>

        {!canPayout && available === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No available balance. Pending funds clear in ~2 business days.
          </p>
        )}
        {!canPayout && available > 0 && (
          <p className="text-xs text-yellow-500 text-center mt-2">
            Minimum payout is $1.00 — you're almost there.
          </p>
        )}
      </div>

      {/* Post-payout confirmation */}
      {payoutResult && (
        <div
          className={`mx-4 mb-4 rounded-lg border p-3 text-xs ${payoutResult.method === "instant" ? "border-fuel/30 bg-fuel/5 text-fuel" : "border-border/50 bg-card/50 text-muted-foreground"}`}
        >
          {payoutResult.method === "instant" ? (
            <>
              ⚡ <strong>${(payoutResult.netCents / 100).toFixed(2)}</strong> is
              on its way — ~30 min to your card. (Stripe processing fee: $
              {(payoutResult.feeCents / 100).toFixed(2)} — passed through at
              cost)
            </>
          ) : (
            <>
              ✓ <strong>${(payoutResult.netCents / 100).toFixed(2)}</strong>{" "}
              transfer initiated — arrives in 1–2 business days.
            </>
          )}
          <div className="text-muted-foreground/60 mt-0.5">
            Payout ID: {payoutResult.payoutId}
          </div>
        </div>
      )}
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
      <div className={`mb-2 ${accent ? "text-fuel" : "text-muted-foreground"}`}>
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
