import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

/**
 * CountUp — animates a number from 0 to `value` the first time it scrolls
 * into view. Used for the landing-page live stats.
 */
export function CountUp({
  value,
  durationMs = 1400,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (value <= 0) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      // easeOutCubic for a snappy settle
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  );
}

export default CountUp;
