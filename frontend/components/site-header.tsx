"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, ButtonLink } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Theme } from "@/lib/theme";
import type { Account } from "@/lib/types";

/**
 * Plain words, deliberately. The house vocabulary — compose, lookbook, shot,
 * preset — is the vocabulary of the thing being sold, and a stranger cannot
 * buy what they cannot name. Every label here says what you get when you click
 * it, and the product's own language is taught inside the pages instead.
 */
const NAV: readonly { href: string; label: string }[] = [
  { href: "/create", label: "Create" },
  { href: "/gallery", label: "Gallery" },
  { href: "/my-work", label: "My work" },
  { href: "/styles", label: "Styles" },
  { href: "/pricing", label: "Pricing" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ account, theme }: { account: Account | null; theme: Theme }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // The sheet remembers which route it was opened on, so a navigation closes
  // it by simply no longer matching — no effect chasing the pathname.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;
  const setMenuOpen = (open: boolean) => setOpenedOn(open ? pathname : null);

  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    await api.logout();
    setSigningOut(false);
    // The session lives in an httpOnly cookie, so only a server render can
    // tell us we are signed out.
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/97 backdrop-blur-[6px]">
      <div className="shell flex h-14 items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Kinograde, home">
          <span aria-hidden className="size-2.5 bg-vermilion" />
          <span className="font-display text-[1.375rem] leading-none tracking-tight">Kinograde</span>
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`springy rounded-[2px] px-3 py-1.5 text-sm ${
                isActive(pathname, item.href)
                  ? "text-ink underline decoration-vermilion decoration-2 underline-offset-[6px]"
                  : "text-graphite hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {account ? (
            <Link
              href="/pricing"
              className="hidden items-center gap-2 border border-rule px-3 py-1.5 font-mono text-xs sm:flex"
              title={`${account.name} · ${account.plan} plan`}
            >
              <span className="text-graphite">CR</span>
              <span className="text-ink">{account.credits}</span>
            </Link>
          ) : null}

          <ThemeToggle initial={theme} />

          {account ? (
            <Button variant="outline" size="sm" onClick={signOut} disabled={signingOut}>
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/sign-in" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/sign-up" size="sm">
                Start
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="springy grid size-9 place-items-center rounded-[2px] border border-rule md:hidden"
          >
            <span className="sr-only">Open menu</span>
            <span aria-hidden className="text-base leading-none">
              ☰
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-[rgb(0_0_0/0.55)]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 border-b border-rule bg-paper p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="label">Menu</span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                className="springy grid size-9 place-items-center rounded-[2px] border border-rule"
              >
                <span className="sr-only">Close menu</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <nav aria-label="Primary, mobile" className="grid">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="border-t border-rule py-3 text-lg first:border-t-0"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {account ? (
              <p className="mt-4 border-t border-rule pt-4 font-mono text-xs text-graphite">
                {account.name} · {account.credits} credits
              </p>
            ) : (
              <div className="mt-5 flex gap-2">
                <ButtonLink href="/sign-in" variant="outline" size="md" className="flex-1">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/sign-up" size="md" className="flex-1">
                  Start
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
