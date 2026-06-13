import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FuelGaugeMark } from "./FuelGaugeMark";

interface TickerDonation {
  _id: string;
  gallons: number;
  donorName: string;
  createdAt: number;
  creatorSlug: string;
  creatorName: string;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

interface DonationTickerProps {
  donations: TickerDonation[];
  className?: string;
}

export function DonationTicker({ donations, className }: DonationTickerProps) {
  const [flashId, setFlashId] = useState<string | null>(null);
  const prevTopId = useRef<string | null>(null);

  useEffect(() => {
    const topId = donations[0]?._id ?? null;
    if (topId && topId !== prevTopId.current) {
      setFlashId(topId);
      prevTopId.current = topId;
      const t = setTimeout(() => setFlashId(null), 2000);
      return () => clearTimeout(t);
    }
  }, [donations]);

  if (donations.length === 0) return null;

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 justify-center">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuel opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-fuel" />
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Live Activity
        </span>
      </div>

      {/* Feed */}
      <div className="space-y-1.5">
        {donations.map((d) => (
          <div
            key={d._id}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-colors duration-700",
              d._id === flashId
                ? "border-fuel/40 bg-fuel/[0.07]"
                : "border-border/30 bg-card/30"
            )}
          >
            <FuelGaugeMark className="size-3.5 text-fuel shrink-0" />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              <span className="font-medium text-foreground">{d.donorName}</span>
              {" gave "}
              <span className="font-semibold text-fuel">
                {d.gallons} {d.gallons === 1 ? "gallon" : "gallons"}
              </span>
              {d.creatorName && (
                <>
                  {" to "}
                  {d.creatorSlug ? (
                    <Link
                      to={`/${d.creatorSlug}`}
                      className="font-medium text-foreground hover:text-fuel transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {d.creatorName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">
                      {d.creatorName}
                    </span>
                  )}
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground/60 shrink-0 tabular-nums">
              {timeAgo(d.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
