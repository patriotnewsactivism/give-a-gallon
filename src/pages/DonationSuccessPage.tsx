import { useQuery } from "convex/react";
import {
  ArrowRight,
  CheckCircle2,
  Fuel,
  Heart,
  Link2,
  Share2,
  Sparkles,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";


function ReferralShare({ slug, code }: { slug: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const refUrl = `${window.location.origin}/${slug}?ref=${code}`;

  function copy() {
    navigator.clipboard.writeText(refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({ title: "Give a Gallon", url: refUrl }).catch(() => {});
    } else {
      copy();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg bg-muted/30 border border-border/30 px-2.5 py-1.5 text-xs font-mono text-muted-foreground">
        {refUrl}
      </code>
      <Button size="sm" variant="outline" onClick={shareNative} className="shrink-0">
        {copied ? "Copied!" : <><Share2 className="size-3.5 mr-1" />Share</>}
      </Button>
    </div>
  );
}

export function DonationSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isSubscription = searchParams.get("subscription") === "1";

  // Poll for the donation record tied to this session
  const donation = useQuery(
    api.donations.getByStripeSession,
    sessionId ? { sessionId } : "skip"
  );

  const creator = useQuery(
    api.creators.getById,
    donation?.creatorId ? { id: donation.creatorId } : "skip"
  );

  const [copied, setCopied] = useState(false);
  // Track how long we've been waiting for the webhook to complete the donation
  const [waitSeconds, setWaitSeconds] = useState(0);


  // Poll counter — show a reassuring message if the webhook is slow
  useEffect(() => {
    if (donation?.status === "completed") return;
    const interval = setInterval(() => setWaitSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [donation?.status]);

  // ── Subscription success screen ──────────────────────────────────────────────
  if (isSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Reveal>
            <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-fuel/10 border border-fuel/20 mb-6">
              <Sparkles className="size-10 text-fuel" />
            </div>
            <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Welcome to the Movement!
            </h1>
            <p className="text-muted-foreground mb-8 text-base">
              Your membership is active. A confirmation email is on its way.
              Every month your gallons flow to the people doing the work.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-fuel text-fuel-foreground hover:bg-fuel/90 font-bold" asChild>
                <Link to="/dashboard">
                  <Fuel className="size-4 mr-2" /> Go to Dashboard
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

  const shareUrl = creator ? `${window.location.origin}/${creator.slug}` : window.location.origin;
  const shareText = creator && donation
    ? `I just fueled ${creator.displayName} with ${donation.gallons} gallon${donation.gallons !== 1 ? "s" : ""} on @GiveAGallon ⛽ Every gallon counts. ${shareUrl}`
    : `I just fueled a cause on @GiveAGallon ⛽ Every gallon counts. ${window.location.origin}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function tweetIt() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  }

  // If no session ID at all, something is wrong
  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-muted-foreground mb-4">No session found. If you were charged, your donation went through.</p>
          <a href="/explore" className="text-fuel underline">Back to campaigns</a>
        </div>
      </div>
    );
  }

  // Webhook may not have fired yet — show reassuring pending state
  if (donation === undefined || (donation && donation.status === "pending" && waitSeconds < 15)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="size-16 rounded-full border-4 border-fuel border-t-transparent animate-spin mx-auto mb-5" />
          <h2 className="text-xl font-bold mb-2">Confirming your donation…</h2>
          <p className="text-muted-foreground text-sm">Hang tight — we're locking in your gallons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Success card */}
        <Reveal className="rounded-2xl border border-fuel/20 bg-card/60 p-7 text-center mb-4">
          {/* Animated check */}
          <div className="relative mx-auto mb-5 size-20">
            <div className="absolute inset-0 rounded-full bg-fuel/10 animate-ping opacity-30" />
            <div className="relative size-20 rounded-full bg-fuel/15 flex items-center justify-center border border-fuel/30">
              <CheckCircle2 className="size-10 text-fuel" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuel/10 text-fuel text-xs font-semibold mb-4">
            <Sparkles className="size-3.5" /> FUELED UP
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TANK'S TOPPED OFF ⛽
          </h1>

          {/* Dynamic impact line */}
          {donation && creator ? (
            <p className="text-muted-foreground leading-relaxed mb-2">
              You gave{" "}
              <span className="text-fuel font-bold">{donation.gallons} gallon{donation.gallons !== 1 ? "s" : ""}</span>
              {" "}to{" "}
              <Link to={`/${creator.slug}`} className="font-semibold text-foreground hover:text-fuel transition-colors">
                {creator.displayName}
              </Link>
              {" "}— that's{" "}
              <span className="font-semibold">≈{Math.round(donation.gallons * 30)} miles</span> of road.
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed mb-2">
              Your donation went through. The creator will receive your gallons
              and get one step closer to their goal.
            </p>
          )}

          {donation && (
            <p className="text-xs text-muted-foreground mb-4">
              ${(donation.amountCents / 100).toFixed(2)} processed · 5% platform fee · ~92% to creator
            </p>
          )}

          {/* What happens next */}
          <div className="rounded-xl bg-muted/20 border border-border/30 p-4 text-left space-y-2 mb-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">What happens next</p>
            {[
              { icon: "⛽", text: "Creator receives your gallons immediately" },
              { icon: "📍", text: "They'll post an update showing the impact" },
              { icon: "✦", text: "You'll see their outcome on their campaign page" },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 text-base">{item.icon}</span>
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Share prompt */}
          <p className="text-sm font-semibold mb-3">Help spread the word ↓</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={tweetIt}
            >
              <Twitter className="size-3.5 mr-1.5" /> Tweet This
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={copyLink}
            >
              <Share2 className="size-3.5 mr-1.5" />
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </Reveal>

        {/* Referral nudge — share the creator's referral link */}
        {creator?.referralCode && (
          <Reveal className="rounded-2xl border border-border/40 bg-card/40 p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 size-9 rounded-full bg-fuel/10 border border-fuel/20 flex items-center justify-center">
                <Link2 className="size-4 text-fuel" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-0.5">Earn gallons for every friend you fuel</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Share {creator.displayName}'s referral link — you both get credit when friends donate.
                </p>
                <ReferralShare slug={creator.slug} code={creator.referralCode} />
              </div>
            </div>
          </Reveal>
        )}

        {/* Secondary actions */}
        <Reveal className="flex flex-col gap-2">
          {creator && (
            <Button className="w-full bg-fuel text-fuel-foreground hover:bg-fuel/90" asChild>
              <Link to={`/${creator.slug}`}>
                <Heart className="size-4 mr-1.5" /> View {creator.displayName}'s Campaign
              </Link>
            </Button>
          )}
          <Button variant="outline" className="w-full" asChild>
            <Link to="/explore">
              <Fuel className="size-4 mr-1.5" /> Fuel Another Campaign
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </Reveal>

      </div>
    </div>
  );
}
