"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger position; each step adds 40ms to the entrance delay. */
  index?: number;
  className?: string;
}

/**
 * Staggered entrance, run once per element.
 *
 * The observer disconnects on the first intersection so scrolling back up
 * never replays the animation. The `.reveal` class ships in the SSR HTML and a
 * <noscript> rule in the layout unhides it, so a JS-less render is not blank.
 */
export function Reveal({ children, index = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("is-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`.trim()} style={{ "--i": index } as CSSProperties}>
      {children}
    </div>
  );
}
