"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Navigations that take longer than this resolve anyway, rather than hanging. */
const COMMIT_TIMEOUT_MS = 450;

/**
 * Cross-document-style View Transitions for the App Router.
 *
 * Next's client navigation is same-document, so the CSS `@view-transition`
 * rule never fires. This intercepts internal link clicks in the capture phase
 * — before Link's own handler — and drives the push inside
 * `document.startViewTransition`, resolving once the pathname has actually
 * changed. If the API is missing or the reader prefers reduced motion no
 * listener is attached at all and links behave exactly as Next intends.
 */
export function ViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const commit = useRef<(() => void) | null>(null);

  // The transition's callback promise resolves when the route it asked for has
  // rendered; this effect is the only place that knows it has.
  useEffect(() => {
    commit.current?.();
    commit.current = null;
  }, [pathname]);

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();

      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const finish = () => {
              window.clearTimeout(timer);
              resolve();
            };
            const timer = window.setTimeout(finish, COMMIT_TIMEOUT_MS);
            commit.current = finish;
            router.push(`${url.pathname}${url.search}`);
          }),
      );
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
