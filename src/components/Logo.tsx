import { cn } from "@/lib/utils";
import { FuelGaugeMark } from "./FuelGaugeMark";

/**
 * Logo — the fuel-gauge brand mark in its badge, optionally with the wordmark.
 * Used in the header, sidebar, and footer so the brand stays consistent.
 */
export function Logo({
  className,
  showWordmark = true,
  wordmarkClassName,
  markBoxClassName,
}: {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  markBoxClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border border-fuel/20 bg-fuel/10",
          markBoxClassName
        )}
      >
        <FuelGaugeMark className="size-5 text-fuel" />
      </span>
      {showWordmark && (
        <span
          className={cn("font-bold text-sm tracking-wide", wordmarkClassName)}
          style={{ fontFamily: "var(--font-display)" }}
        >
          GIVE A GALLON
        </span>
      )}
    </span>
  );
}

export default Logo;
