"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";

/**
 * The acid-lime promo strip that sits above the nav on the original, including
 * its dismiss affordance. Purely local state — there is nothing to remember
 * across visits that would justify storage.
 */
export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-acid px-10 py-2.5 text-ink-950">
      <Icon name="spark" className="hidden h-4 w-4 shrink-0 sm:block" />
      <p className="text-[13px] font-medium">
        Get an additional discount on premium plans after signing up
      </p>
      <Link
        href="/pricing"
        className="shrink-0 rounded-full bg-ink-950 px-3 py-1 text-[12px] font-semibold text-acid transition-opacity hover:opacity-85"
      >
        Get your discount
      </Link>
      <button
        onClick={() => setOpen(false)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-60"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  );
}
