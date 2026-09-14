"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button, CreditPill, Icon } from "./ui";
import { Logo } from "./Logo";

const NAV = [
  { href: "/generate", label: "Generate", icon: "wand" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/projects", label: "Projects", icon: "grid" },
  { href: "/effects", label: "Effects", icon: "camera" },
  { href: "/pricing", label: "Pricing", icon: "spark" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account, ready, signOut } = useStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Rail: icon+label on desktop, hidden on mobile in favour of the tab bar. */}
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-screen w-[208px] shrink-0 flex-col border-r border-ink-100/8 bg-ink-900 px-3 py-4 md:flex">
          <Link href="/" className="mb-6 flex items-center gap-2 px-2">
            <Logo className="h-6 w-6" />
            <span className="text-[15px] font-semibold tracking-tight">Higgsfield</span>
          </Link>

          <Link
            href="/generate"
            className="mb-5 flex h-10 items-center justify-center gap-2 rounded-[8px] bg-ink-100 text-sm font-medium text-ink-950 transition-colors hover:bg-white"
          >
            <Icon name="plus" className="h-4 w-4" />
            New generation
          </Link>

          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-ink-800 text-ink-100"
                    : "text-ink-400 hover:bg-ink-850 hover:text-ink-100"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-3 px-1">
            {ready && account ? (
              <div className="rounded-[10px] border border-ink-100/8 bg-ink-850 p-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 text-[11px] font-semibold uppercase">
                    {account.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{account.name}</p>
                    <p className="truncate text-[11px] capitalize text-ink-500">
                      {account.plan} plan
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <CreditPill credits={account.credits} />
                  <button
                    onClick={signOut}
                    className="text-[11px] text-ink-500 transition-colors hover:text-ink-200"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : ready ? (
              <Link href="/signup" className="block">
                <Button size="sm" className="w-full">
                  Sign up free
                </Button>
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100/8 bg-ink-950/85 px-4 backdrop-blur md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-5 w-5" />
              <span className="text-sm font-semibold tracking-tight">Higgsfield</span>
            </Link>
            {ready && account ? (
              <CreditPill credits={account.credits} />
            ) : ready ? (
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            ) : null}
          </header>

          <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
        </div>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-ink-100/8 bg-ink-900/95 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
              isActive(item.href) ? "text-acid" : "text-ink-400"
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
