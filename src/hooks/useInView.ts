import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * useInView — fires once when an element scrolls into the viewport.
 * Used for scroll-reveal animations and triggering count-ups.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, options]);

  return [ref, inView];
}
