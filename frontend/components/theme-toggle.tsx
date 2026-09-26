"use client";

import { useState } from "react";
import { THEME_COOKIE, THEME_MAX_AGE, type Theme } from "@/lib/theme";

/**
 * Persists to a cookie, not localStorage, so the server can render the right
 * ground colour on the very first paint. The document attribute is flipped
 * directly rather than via a re-render, because every colour in the system is
 * a CSS variable hanging off it. Dark is the default; this switches to paper.
 */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const dark = theme === "dark";

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_MAX_AGE}; samesite=lax`;
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={toggle}
      title={dark ? "Switch to paper" : "Switch to the dark room"}
      className="springy grid size-8 place-items-center rounded-[2px] border border-rule text-graphite hover:border-graphite hover:text-ink"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        {dark ? (
          <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" fill="currentColor" />
        ) : (
          <>
            <circle cx="8" cy="8" r="3.1" fill="currentColor" stroke="none" />
            <path d="M8 .9v1.8M8 13.3v1.8M.9 8h1.8M13.3 8h1.8M3 3l1.3 1.3M11.7 11.7 13 13M13 3l-1.3 1.3M4.3 11.7 3 13" />
          </>
        )}
      </svg>
    </button>
  );
}
