import { cn } from "@/lib/utils";

/**
 * FuelGaugeMark — the compact "Give a Gallon" brand mark.
 *
 * A miniature fuel gauge (arc + needle) sized like a Lucide icon (24×24 box).
 * Inherits color via `currentColor`, so set it with a text color (e.g. text-fuel).
 * Stays legible down to ~16px, which makes it usable as a logo and favicon.
 */
export function FuelGaugeMark({
  className,
  fraction = 0.68,
}: {
  className?: string;
  fraction?: number;
}) {
  const f = Math.max(0, Math.min(fraction, 1));
  const cx = 12;
  const cy = 15.5;
  const r = 8;
  const needleR = 6;
  const rad = ((180 - f * 180) * Math.PI) / 180; // 180°=Empty … 0°=Full

  const fillEnd = { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  const needle = {
    x: cx + needleR * Math.cos(rad),
    y: cy - needleR * Math.sin(rad),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      aria-hidden="true"
    >
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${fillEnd.x.toFixed(2)} ${fillEnd.y.toFixed(2)}`}
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needle.x.toFixed(2)}
        y2={needle.y.toFixed(2)}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Hub */}
      <circle cx={cx} cy={cy} r={1.7} fill="currentColor" />
    </svg>
  );
}

export default FuelGaugeMark;
