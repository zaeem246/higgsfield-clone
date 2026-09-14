"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { CAMERA_MOVES, EFFECTS, MODELS } from "@/lib/catalog";
import { PLAN_CREDITS } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Poster } from "@/components/Poster";
import { Button, Icon } from "@/components/ui";

const SHOWCASE = ["signup-a", "signup-b", "signup-c", "signup-d"];

export default function SignupPage() {
  const router = useRouter();
  const { signUp, account, ready } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    signUp(name, trimmed);
    router.push("/generate");
  };

  return (
    <div className="flex min-h-screen">
      {/* Form */}
      <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-[46%]">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-[17px] font-semibold tracking-tight">Higgsfield</span>
          </Link>

          {ready && account ? (
            <div>
              <h1 className="display text-2xl font-semibold">
                You&rsquo;re signed in as {account.name}
              </h1>
              <p className="mt-2 text-sm text-ink-400">
                {account.credits.toLocaleString()} credits available on the{" "}
                <span className="capitalize">{account.plan}</span> plan.
              </p>
              <Link href="/generate" className="mt-6 block">
                <Button size="lg" className="w-full">
                  Go to the generator
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="display text-3xl font-semibold">Create your account</h1>
              <p className="mt-2.5 text-sm text-ink-400">
                {PLAN_CREDITS.free} free credits, no card. Enough for about 30 stills or
                3 video takes.
              </p>

              <form onSubmit={submit} className="mt-7 space-y-3.5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                    className="h-11 w-full rounded-[9px] border border-ink-700 bg-ink-850 px-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-ink-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="you@studio.com"
                    autoComplete="email"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "email-error" : undefined}
                    className={`h-11 w-full rounded-[9px] border bg-ink-850 px-3 text-sm outline-none transition-colors placeholder:text-ink-500 focus:border-ink-500 ${
                      error ? "border-red-500/60" : "border-ink-700"
                    }`}
                  />
                  {error && (
                    <p id="email-error" className="mt-1.5 text-[12px] text-red-400">
                      {error}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Create account
                </Button>
              </form>

              <p className="mt-4 text-[12px] leading-relaxed text-ink-500">
                Demo account: no password and no server. Your profile and generations are
                stored in this browser only, and never leave it.
              </p>

              <p className="mt-5 text-[13px] text-ink-400">
                Just looking?{" "}
                <Link
                  href="/explore"
                  className="text-ink-100 underline underline-offset-2 hover:text-acid"
                >
                  Browse the community feed
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Showcase */}
      <div className="relative hidden overflow-hidden border-l border-ink-100/8 lg:block lg:w-[54%]">
        <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
          {SHOWCASE.map((seed, i) => (
            <Poster
              key={seed}
              seed={seed}
              aspectId="3:4"
              sizes={700}
              className={`rounded-[10px] ${i % 2 ? "mt-8" : ""}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="display max-w-sm text-2xl font-semibold">
            {CAMERA_MOVES.length} camera moves. {EFFECTS.length} effects.{" "}
            {MODELS.length} models.
          </p>
          <p className="mt-2.5 flex items-center gap-2 text-sm text-ink-300">
            <Icon name="camera" className="h-4 w-4 text-acid" />
            Direct the shot, not just the subject.
          </p>
        </div>
      </div>
    </div>
  );
}
