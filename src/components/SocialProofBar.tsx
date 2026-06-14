import { useQuery } from "convex/react";
import { Fuel } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function SocialProofBar() {
  const donations = useQuery(api.donations.getRecent, { limit: 8 });
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!donations || donations.length === 0) return;
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % donations.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [donations]);

  if (!donations || donations.length === 0) return null;

  const d = donations[index];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border/60 bg-card/90 backdrop-blur-md shadow-xl shadow-black/30 text-sm transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <span className="relative flex size-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuel opacity-60" />
          <span className="relative inline-flex rounded-full size-2 bg-fuel" />
        </span>
        <Fuel className="size-3.5 text-fuel shrink-0" />
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{d.donorName}</span>
          {" gave "}
          <span className="font-semibold text-fuel">{d.gallons} gal</span>
          {d.creatorSlug && d.creatorName && (
            <>
              {" to "}
              <Link
                to={`/${d.creatorSlug}`}
                className="font-semibold text-foreground hover:text-fuel transition-colors"
              >
                {d.creatorName}
              </Link>
            </>
          )}
        </span>
        <span className="text-xs text-muted-foreground/60 shrink-0">{timeAgo(d.createdAt)}</span>
      </div>
    </div>
  );
}
