import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * FuelGauge — the signature "Give a Gallon" visual.
 *
 * A semicircular automotive-style fuel gauge that animates from Empty (E) toward
 * Full (F) based on gallons received vs. a goal. When no goal is set it renders a
 * decorative "received" readout instead of a misleading empty gauge.
 *
 * Animation is pure CSS (a `stroke-dashoffset` transition) so it stays dependency
 * free AND re-animates smoothly whenever `value` changes — ideal for live updates.
 */

const CX = 100;
const CY = 100;
const R = 78;
const ARC_LENGTH = Math.PI * R; // length of the 180° track

// Convert a gauge angle (180° = Empty/left, 0° = Full/right) to an SVG point.
function polar(angleDeg: number, r = R) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

const START = polar(180); // Empty
const END = polar(0); // Full
const TRACK_PATH = `M ${START.x} ${START.y} A ${R} ${R} 0 0 1 ${END.x} ${END.y}`;

const TICK_ANGLES = [180, 150, 120, 90, 60, 30, 0];

export interface FuelGaugeProps {
  /** Gallons received so far. */
  value: number;
  /** Goal in gallons. When absent/zero the gauge shows a "received" readout. */
  goal?: number;
  /** Pixel width of the gauge. Height is derived from the viewBox. */
  size?: number;
  /** Hide the centered numeric readout (useful for compact cards). */
  showReadout?: boolean;
  /** Override the readout's sub-line (e.g. for a community/platform gauge). */
  subtitle?: string;
  className?: string;
}

export function FuelGauge({
  value,
  goal,
  size = 240,
  showReadout = true,
  subtitle,
  className,
}: FuelGaugeProps) {
  const hasGoal = typeof goal === "number" && goal > 0;
  const fraction = hasGoal ? Math.min(value / goal, 1) : value > 0 ? 1 : 0;
  const pct = Math.round(fraction * 100);

  // Leading-edge indicator sits at the current fill angle (180° → 0°).
  const dot = polar(180 - fraction * 180);
  const dashOffset = ARC_LENGTH * (1 - fraction);

  // Animate from empty on first paint, then track `dashOffset` on every change.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, maxWidth: "100%" }}
      role="img"
      aria-label={
        hasGoal
          ? `${value} of ${goal} gallons — ${pct}% to goal`
          : `${value} gallons received`
      }
    >
      <svg
        viewBox="0 0 200 132"
        className="w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fuelGaugeFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--fuel-muted)" />
            <stop offset="100%" stopColor="var(--fuel)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/15"
          strokeWidth={12}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {TICK_ANGLES.map(angle => {
          const outer = polar(angle, R + 9);
          const inner = polar(angle, R + 3);
          return (
            <line
              key={angle}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              className="text-muted-foreground/30"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}

        {/* Animated fill */}
        <path
          d={TRACK_PATH}
          fill="none"
          stroke="url(#fuelGaugeFill)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          style={{
            strokeDashoffset: mounted ? dashOffset : ARC_LENGTH,
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Leading-edge glow dot */}
        {fraction > 0 && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={6}
            fill="var(--fuel)"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease 1.2s",
            }}
          />
        )}

        {/* E / F end labels */}
        <text
          x={START.x}
          y={CY + 16}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-semibold"
        >
          E
        </text>
        <text
          x={END.x}
          y={CY + 16}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-semibold"
        >
          F
        </text>
      </svg>

      {showReadout && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
          <span
            className="text-3xl font-bold leading-none text-fuel"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value.toLocaleString()}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {subtitle ? (
              subtitle
            ) : hasGoal ? (
              <>
                of {goal.toLocaleString()} gallon goal · {pct}%
              </>
            ) : (
              <>gallons received</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export default FuelGauge;
