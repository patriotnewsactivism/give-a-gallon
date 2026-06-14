import { useAction, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Fuel,
  Heart,
  MapPin,
  MessageSquare,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { CATEGORIES, VERIFICATION_TIERS, URGENCY_LEVELS } from "../../convex/constants";
import { FuelGauge } from "@/components/FuelGauge";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { ShareSheet } from "@/components/ShareSheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GALLON_PRICE, GALLON_PRESETS } from "@/lib/constants";
import { useReferral, clearReferral } from "@/hooks/useReferral";

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function VerificationBadge({ status, note }: { status?: string; note?: string }) {
  const tier = VERIFICATION_TIERS[(status ?? "unverified") as keyof typeof VERIFICATION_TIERS];
  if (!tier || status === "unverified" || !status) return null;
  return (
    <span
      title={note ?? tier.label}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${tier.color} ${tier.bg} border-current/20`}
    >
      <Shield className="size-3" />
      {tier.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency?: string }) {
  if (!urgency || urgency === "low") return null;
  const u = URGENCY_LEVELS[urgency as keyof typeof URGENCY_LEVELS];
  if (!u) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${u.color}`}>
      <Zap className="size-3" /> {u.label}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export function CreatorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const creator = useQuery(api.creators.getBySlug, { slug: slug ?? "" });
  const donations = useQuery(
    api.donations.listForCreator,
    creator ? { creatorId: creator._id, limit: 20 } : "skip"
  );
  const updates = useQuery(
    api.updates.listForCreator,
    creator ? { creatorId: creator._id, limit: 10 } : "skip"
  );
  const milestones = useQuery(
    api.milestones.listForCreator,
    creator ? { creatorId: creator._id } : "skip"
  );

  if (creator === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-fuel border-t-transparent animate-spin" />
      </div>
    );
  }

  if (creator === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Fuel className="size-12 text-muted-foreground/30" />
        <h1 className="text-xl font-semibold">Campaign not found</h1>
        <p className="text-sm text-muted-foreground">This page doesn't exist yet.</p>
        <Button variant="outline" asChild>
          <Link to="/explore"><ArrowLeft className="size-4 mr-1" /> Browse Campaigns</Link>
        </Button>
      </div>
    );
  }

  const catInfo = CATEGORIES.find(c => c.id === creator.category);
  const completedDonations = (donations ?? []).filter((d: any) => d.status === "completed");
  const pct = creator.goal ? Math.min(100, Math.round((creator.totalGallons / creator.goal) * 100)) : null;
  const completedMilestones = (milestones ?? []).filter((m: any) => m.isCompleted);

  return (
    <div className="min-h-screen">
      {/* Cover image */}
      {creator.coverUrl && (
        <div className="relative h-44 sm:h-64 overflow-hidden">
          <img src={creator.coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <div className="container py-6 max-w-4xl">
        <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="size-3.5" /> Browse Campaigns
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Profile header */}
            <Reveal>
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-fuel/20 bg-fuel/10">
                  {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} alt={creator.displayName} className="size-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-fuel" style={{ fontFamily: "var(--font-display)" }}>
                      {creator.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {creator.displayName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {creator.location && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" />{creator.location}
                      </span>
                    )}
                    {catInfo && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/40">
                        {catInfo.icon} {catInfo.label}
                      </span>
                    )}
                    <VerificationBadge status={creator.verificationStatus} note={creator.verificationNote} />
                    <UrgencyBadge urgency={creator.urgency} />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Bio */}
            {creator.bio && (
              <Reveal>
                <p className="text-muted-foreground leading-relaxed">{creator.bio}</p>
              </Reveal>
            )}

            {/* Fuel gauge + mini stats */}
            <Reveal>
              <div className="p-5 rounded-xl border border-border/50 bg-card/50">
                <div className="flex flex-col items-center mb-4">
                  <FuelGauge value={creator.totalGallons} goal={creator.goal} size={240} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Raised", value: `$${(creator.totalGallons * GALLON_PRICE).toFixed(0)}` },
                    { label: "Supporters", value: creator.totalDonations.toString() },
                    { label: "Gallons", value: creator.totalGallons.toString() },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg border border-border/30 bg-background/40 p-2.5 text-center">
                      <div className="text-base font-bold text-fuel" style={{ fontFamily: "var(--font-display)" }}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Milestones */}
            {milestones && milestones.length > 0 && (
              <Reveal>
                <h2 className="font-bold text-base mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <TrendingUp className="size-4 text-fuel" /> MILESTONES
                </h2>
                <div className="space-y-2">
                  {(milestones as any[]).map((m, i) => {
                    const targetGallons = Math.ceil(m.targetCents / (GALLON_PRICE * 100));
                    const done = creator.totalAmountCents >= m.targetCents;
                    const mpct = Math.min(100, Math.round((creator.totalAmountCents / m.targetCents) * 100));
                    return (
                      <div key={m._id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${done ? "border-fuel/30 bg-fuel/[0.04]" : "border-border/30 bg-card/30"}`}>
                        <div className={`mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-fuel text-fuel-foreground" : "border-2 border-border/50"}`}>
                          {done && <CheckCircle2 className="size-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${done ? "text-fuel" : ""}`}>{m.title}</span>
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">${(m.targetCents / 100).toFixed(0)}</span>
                          </div>
                          {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                          {!done && (
                            <div className="mt-1.5 h-1 rounded-full bg-muted/40 overflow-hidden">
                              <div className="h-full bg-fuel/60 rounded-full transition-all" style={{ width: `${mpct}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            )}

            {/* Campaign Updates timeline */}
            {updates && updates.length > 0 && (
              <Reveal>
                <h2 className="font-bold text-base mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <Fuel className="size-4 text-fuel" /> UPDATES
                </h2>
                <div className="relative pl-4 border-l-2 border-border/30 space-y-4">
                  {(updates as any[]).map((u, i) => (
                    <div key={u._id} className="relative">
                      <div className="absolute -left-[1.35rem] top-1 size-3 rounded-full bg-fuel/80 border-2 border-background" />
                      <div className="p-3 rounded-lg border border-border/30 bg-card/40">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm">{u.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(u.createdAt)}</span>
                        </div>
                        {u.imageUrl && (
                          <img src={u.imageUrl} alt={u.title} className="w-full rounded-md object-cover max-h-48 mb-2 mt-1" />
                        )}
                        <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                        {u.impactTag && (
                          <span className="mt-2 inline-flex items-center gap-1 text-xs bg-fuel/10 text-fuel px-2 py-0.5 rounded-full font-medium">
                            ✦ {u.impactTag}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {/* Social links */}
            {creator.socialLinks && Object.values(creator.socialLinks).some(Boolean) && (
              <Reveal>
                <div className="flex flex-wrap items-center gap-2">
                  {creator.socialLinks.youtube && <SocialLink url={creator.socialLinks.youtube} label="YouTube" />}
                  {creator.socialLinks.twitter && <SocialLink url={creator.socialLinks.twitter} label="Twitter / X" />}
                  {creator.socialLinks.instagram && <SocialLink url={creator.socialLinks.instagram} label="Instagram" />}
                  {creator.socialLinks.website && <SocialLink url={creator.socialLinks.website} label="Website" />}
                </div>
              </Reveal>
            )}

            {/* Share */}
            <Reveal>
              <ShareSheet
                url={window.location.href}
                title={`Fuel ${creator.displayName} on Give-A-Gallon`}
                description={`${creator.displayName} needs your support. Give a gallon and fuel the fight. ${window.location.href}`}
              />
            </Reveal>

            {/* Donor wall */}
            <Reveal>
              <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <Heart className="size-4 text-fuel" /> SUPPORTERS
              </h2>
              {completedDonations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Be the first to give a gallon!</p>
              ) : (
                <div className="space-y-2">
                  {completedDonations.map((d: any) => (
                    <div key={d._id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/30">
                      <div className="size-8 rounded-full bg-fuel/10 flex items-center justify-center shrink-0 text-xs font-bold text-fuel">
                        {d.donorName?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{d.donorName}</span>
                          <span className="text-xs text-fuel font-semibold">+{d.gallons} gal</span>
                        </div>
                        {d.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                            <MessageSquare className="size-3 mt-0.5 shrink-0" />{d.message}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(d.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>
          </div>

          {/* ── Right column: Donation form ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <DonationForm creatorId={creator._id} creatorName={creator.displayName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Donation form ──────────────────────────────────────────────────────────

function DonationForm({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const { referralCode } = useReferral();
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [gallons, setGallons] = useState(3);
  const [customGallons, setCustomGallons] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveGallons = isCustom ? Number(customGallons) || 0 : gallons;
  const totalAmount = effectiveGallons * GALLON_PRICE;
  const platformFee = totalAmount * 0.05;

  const handleSubmit = async () => {
    if (effectiveGallons < 1) { toast.error("Please select at least 1 gallon"); return; }
    if (!isAnonymous && !donorName.trim()) { toast.error("Please enter your name or donate anonymously"); return; }
    setSubmitting(true);
    try {
      const { url } = await createCheckout({
        creatorId: creatorId as any,
        gallons: effectiveGallons,
        donorName: isAnonymous ? undefined : donorName.trim(),
        message: message.trim() || undefined,
        isAnonymous,
        referralCode,
      });
      clearReferral();
      window.location.href = url;
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4">
      <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
        FUEL {creatorName.toUpperCase()}
      </h2>

      {/* Presets */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Choose gallons</div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {GALLON_PRESETS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => { setGallons(p); setIsCustom(false); }}
              className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${!isCustom && gallons === p ? "bg-fuel text-fuel-foreground border-fuel" : "border-border/50 hover:border-fuel/40 text-muted-foreground hover:text-foreground"}`}
            >
              {p} gal
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`py-2 rounded-lg text-sm font-semibold border transition-colors col-span-3 ${isCustom ? "bg-fuel text-fuel-foreground border-fuel" : "border-border/50 hover:border-fuel/40 text-muted-foreground hover:text-foreground"}`}
          >
            Custom
          </button>
        </div>
        {isCustom && (
          <Input
            type="number"
            min={1}
            max={1000}
            placeholder="Enter gallons…"
            value={customGallons}
            onChange={e => setCustomGallons(e.target.value)}
            className="bg-background border-border/50"
          />
        )}
      </div>

      {/* Name */}
      {!isAnonymous && (
        <Input
          placeholder="Your name"
          value={donorName}
          onChange={e => setDonorName(e.target.value)}
          className="bg-background border-border/50"
        />
      )}
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
        Donate anonymously
      </label>

      {/* Message */}
      <Textarea
        placeholder="Leave a message (optional)"
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={2}
        className="bg-background border-border/50 resize-none text-sm"
      />

      {/* Amount + fee */}
      {effectiveGallons > 0 && (
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{effectiveGallons} gallon{effectiveGallons !== 1 ? "s" : ""}</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground/70">
            <span>Platform fee (5%)</span>
            <span>${platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-border/30 pt-1 mt-1">
            <span>Total</span>
            <span className="text-fuel">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold"
        onClick={handleSubmit}
        disabled={submitting || effectiveGallons < 1}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Redirecting…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Fuel className="size-4" />
            Give {effectiveGallons > 0 ? `${effectiveGallons} Gallon${effectiveGallons !== 1 ? "s" : ""}` : "Gallons"}
          </span>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Powered by Stripe · Secure checkout</p>
    </div>
  );
}

function SocialLink({ url, label }: { url: string; label: string }) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
    >
      <ExternalLink className="size-3" />{label}
    </a>
  );
}
