"use client";

import { useEffect, useRef, useState } from "react";

interface TweenNumberProps {
  value: number;
  className?: string;
  /** Read out with the value by assistive tech, e.g. "credits". */
  unitLabel: string;
}

const DURATION_MS = 420;

/**
 * A number that travels to its new value instead of snapping.
 *
 * The cost readout changing is the product explaining cause and effect: you
 * added a preset, the spend moved. Snapping loses that, so the figure counts
 * up or down over ~400ms and flicks vermilion as it goes. Under
 * prefers-reduced-motion the duration is zero and the first frame lands on the
 * final value.
 *
 * Only the settled figure is announced — a live region on the tweening digits
 * would read out every intermediate frame.
 */
export function TweenNumber({ value, className = "", unitLabel }: TweenNumberProps) {
  const [display, setDisplay] = useState(value);
  const [flick, setFlick] = useState(0);
  // Read at the start of each tween so an interrupted one continues from where
  // it actually is rather than jumping back to the previous target.
  const shown = useRef(value);

  useEffect(() => {
    const from = shown.current;
    if (from === value) return;

    setFlick((n) => n + 1);

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : DURATION_MS;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      shown.current = Math.round(from + (value - from) * eased);
      setDisplay(shown.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      <span key={flick} aria-hidden className={`tick ${className}`.trim()}>
        {display}
      </span>
      <span className="sr-only" aria-live="polite">
        {value} {unitLabel}
      </span>
    </>
  );
}
