/**
 * LiveDonationToast — fires ONLY when a new donation hits Convex in real time.
 * Replaces the old SocialProofBar that cycled old donations on a timer.
 *
 * - Subscribes to getRecent via Convex live query (websocket-backed)
 * - Tracks the most-recent donation ID seen on mount; ignores everything older
 * - Each new donation triggers a slide-up toast with a link to that campaign
 * - Auto-dismisses after 6 seconds; user can also close it manually
 */
import { useQuery } from "convex/react";
import { Fuel, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

interface ToastDonation {
  _id: string;
  gallons: number;
  donorName: string;
  creatorSlug?: string;
  creatorName?: string;
}

const DISMISS_MS = 6000;

export function SocialProofBar() {
  const donations = useQuery(api.donations.getRecent, { limit: 5 });

  // The ID of the latest donation we've already shown (or null on first load)
  const seenLatestId = useRef<string | null>(null);
  const [toast, setToast] = useState<ToastDonation | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 350); // wait for slide-out
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  useEffect(() => {
    if (!donations || donations.length === 0) return;

    const latest = donations[0];

    // First load — record the current latest but don't show a toast
    if (seenLatestId.current === null) {
      seenLatestId.current = latest._id;
      return;
    }

    // No change
    if (latest._id === seenLatestId.current) return;

    // New donation arrived — show toast
    seenLatestId.current = latest._id;

    // Clear any existing timer
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    setToast(latest);
    // Small delay so the slide-up animation plays
    requestAnimationFrame(() => setVisible(true));

    dismissTimer.current = setTimeout(() => dismiss(), DISMISS_MS);
  }, [donations, dismiss]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-350 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl border border-fuel/30 bg-card/95 backdrop-blur-md shadow-2xl shadow-black/40 text-sm max-w-xs sm:max-w-sm">
        {/* Live dot */}
        <span className="relative flex size-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuel opacity-60" />
          <span className="relative inline-flex rounded-full size-2 bg-fuel" />
        </span>

        <Fuel className="size-4 text-fuel shrink-0" />

        <span className="flex-1 min-w-0 text-muted-foreground leading-snug">
          <span className="font-semibold text-foreground">
            {toast.donorName}
          </span>
          {" just gave "}
          <span className="font-bold text-fuel">{toast.gallons} gal</span>
          {toast.creatorSlug && toast.creatorName && (
            <>
              {" to "}
              <Link
                to={`/${toast.creatorSlug}`}
                className="font-semibold text-foreground hover:text-fuel transition-colors underline underline-offset-2 decoration-fuel/40"
                onClick={dismiss}
              >
                {toast.creatorName}
              </Link>
            </>
          )}
        </span>

        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
