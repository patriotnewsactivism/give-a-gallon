import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Fuel,
  Heart,
  MapPin,
  MessageSquare,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GALLON_PRICE, GALLON_PRESETS } from "@/lib/constants";

export function CreatorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const creator = useQuery(api.creators.getBySlug, {
    slug: slug ?? "",
  });
  const donations = useQuery(
    api.donations.listForCreator,
    creator ? { creatorId: creator._id, limit: 20 } : "skip"
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
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground text-sm">
          This activist page doesn't exist yet.
        </p>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="size-4 mr-1" />
            Back Home
          </Link>
        </Button>
      </div>
    );
  }

  const fillPct =
    creator.goal && creator.goal > 0
      ? Math.min((creator.totalGallons / creator.goal) * 100, 100)
      : 0;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-4xl">
        {/* Back link */}
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-3.5" />
          Browse Activists
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Profile info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile header */}
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-full bg-fuel/10 border border-fuel/20 flex items-center justify-center shrink-0">
                <span
                  className="text-fuel font-bold text-xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {creator.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {creator.displayName}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {creator.location && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {creator.location}
                    </span>
                  )}
                  {creator.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-fuel/10 text-fuel border border-fuel/20">
                      {creator.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {creator.bio && (
              <p className="text-muted-foreground leading-relaxed">
                {creator.bio}
              </p>
            )}

            {/* Fuel gauge */}
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Fuel className="size-4 text-fuel" />
                  {creator.totalGallons} gallons received
                </span>
                {creator.goal && creator.goal > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Goal: {creator.goal} gallons
                  </span>
                )}
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuel/80 to-fuel transition-all duration-700"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  ${((creator.totalGallons * GALLON_PRICE)).toFixed(2)} raised
                </span>
                <span>{creator.totalDonations} supporters</span>
              </div>
            </div>

            {/* Social links */}
            {creator.socialLinks && (
              <div className="flex items-center gap-2">
                {creator.socialLinks.youtube && (
                  <SocialLink url={creator.socialLinks.youtube} label="YouTube" />
                )}
                {creator.socialLinks.twitter && (
                  <SocialLink url={creator.socialLinks.twitter} label="Twitter" />
                )}
                {creator.socialLinks.website && (
                  <SocialLink
                    url={creator.socialLinks.website}
                    label="Website"
                  />
                )}
                {creator.socialLinks.instagram && (
                  <SocialLink
                    url={creator.socialLinks.instagram}
                    label="Instagram"
                  />
                )}
              </div>
            )}

            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}
            >
              <Share2 className="size-3.5 mr-1" />
              Share This Page
            </Button>

            {/* Recent supporters */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Heart className="size-4 text-fuel" />
                Recent Supporters
              </h2>
              {!donations || donations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Be the first to give a gallon!
                </p>
              ) : (
                <div className="space-y-2">
                  {donations
                    .filter((d) => d.status === "completed")
                    .map((d) => (
                      <div
                        key={d._id}
                        className="p-3 rounded-lg border border-border/30 bg-card/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {d.donorName}
                          </span>
                          <span className="text-xs text-fuel font-medium flex items-center gap-1">
                            <Fuel className="size-3" />
                            {d.gallons}{" "}
                            {d.gallons === 1 ? "gallon" : "gallons"}
                          </span>
                        </div>
                        {d.message && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                            <MessageSquare className="size-3 mt-0.5 shrink-0" />
                            {d.message}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground/60 mt-1">
                          {timeAgo(d.createdAt)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Donation form */}
          <div className="lg:col-span-2">
            <DonationForm creatorId={creator._id} creatorName={creator.displayName} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DonationForm({
  creatorId,
  creatorName,
}: {
  creatorId: string;
  creatorName: string;
}) {
  const createDonation = useMutation(api.donations.create);
  const [gallons, setGallons] = useState(3);
  const [customGallons, setCustomGallons] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveGallons = isCustom ? Number(customGallons) || 0 : gallons;
  const totalAmount = effectiveGallons * GALLON_PRICE;

  const handleSubmit = async () => {
    if (effectiveGallons < 1) {
      toast.error("Give at least 1 gallon!");
      return;
    }
    setSubmitting(true);
    try {
      await createDonation({
        creatorId: creatorId as any,
        gallons: effectiveGallons,
        donorName: isAnonymous ? undefined : donorName || undefined,
        message: message || undefined,
        isAnonymous,
      });
      setSubmitted(true);
      toast.success("Gallons sent! 🔥");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="sticky top-20 rounded-xl border border-fuel/30 bg-card p-6 text-center">
        <div className="size-14 rounded-full bg-fuel/10 mx-auto mb-4 flex items-center justify-center">
          <Check className="size-7 text-fuel" />
        </div>
        <h3
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FUELED UP!
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          You gave {effectiveGallons}{" "}
          {effectiveGallons === 1 ? "gallon" : "gallons"} to {creatorName}.
          That's real fuel for the fight.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmitted(false);
            setGallons(3);
            setMessage("");
            setDonorName("");
          }}
        >
          Give Again
        </Button>
      </div>
    );
  }

  return (
    <div className="sticky top-20 rounded-xl border border-border/50 bg-card p-5 space-y-5">
      <h3
        className="text-lg font-bold flex items-center gap-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <Fuel className="size-5 text-fuel" />
        GIVE A GALLON
      </h3>

      {/* Gallon selector */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          How many gallons?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GALLON_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setGallons(n);
                setIsCustom(false);
              }}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                !isCustom && gallons === n
                  ? "border-fuel bg-fuel/10 text-fuel"
                  : "border-border/50 text-muted-foreground hover:border-fuel/30"
              }`}
            >
              {n} gal
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
              isCustom
                ? "border-fuel bg-fuel/10 text-fuel"
                : "border-border/50 text-muted-foreground hover:border-fuel/30"
            }`}
          >
            Custom
          </button>
        </div>
        {isCustom && (
          <Input
            type="number"
            min={1}
            max={1000}
            placeholder="Enter gallons..."
            value={customGallons}
            onChange={(e) => setCustomGallons(e.target.value)}
            className="mt-2 bg-background"
          />
        )}
      </div>

      {/* Total */}
      <div className="p-3 rounded-lg bg-fuel/5 border border-fuel/20 text-center">
        <div className="text-xs text-muted-foreground">Total</div>
        <div
          className="text-2xl font-bold text-fuel"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ${totalAmount.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground">
          {effectiveGallons} {effectiveGallons === 1 ? "gallon" : "gallons"} × $
          {GALLON_PRICE.toFixed(2)}
        </div>
      </div>

      {/* Donor name */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Your name (optional)
        </label>
        <Input
          placeholder="Your name"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          disabled={isAnonymous}
          className="bg-background"
        />
        <label className="flex items-center gap-2 mt-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-border/50 accent-fuel"
          />
          Give anonymously
        </label>
      </div>

      {/* Message */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          Leave a message (optional)
        </label>
        <Textarea
          placeholder="Keep fighting the good fight!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="bg-background resize-none"
        />
      </div>

      {/* Submit */}
      <Button
        className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90 h-11 font-semibold"
        disabled={effectiveGallons < 1 || submitting}
        onClick={handleSubmit}
      >
        {submitting ? (
          "Processing..."
        ) : (
          <>
            <Fuel className="size-4 mr-1" />
            Give {effectiveGallons} {effectiveGallons === 1 ? "Gallon" : "Gallons"}
          </>
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        5% platform fee · Payment processing by Stripe
      </p>
    </div>
  );
}

function SocialLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-fuel transition-colors px-2 py-1 rounded border border-border/30 hover:border-fuel/30"
    >
      <ExternalLink className="size-3" />
      {label}
    </a>
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
