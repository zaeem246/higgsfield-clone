"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { api } from "@/lib/api";
import type { ApiError } from "@/lib/types";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  /** Where to land afterwards; always an internal path. */
  next: string;
}

/**
 * The session is set by the gateway as an httpOnly cookie on the response to
 * this POST, so there is nothing to store client-side. A router.refresh() is
 * what makes the rest of the app notice: every signed-in surface is
 * server-rendered from /api/auth/me.
 */
export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const register = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = register
      ? await api.register({ email, name, password })
      : await api.login({ email, password });

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {register ? (
        <Field htmlFor="auth-name" label="Name">
          <TextInput
            id="auth-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Vasquez"
          />
        </Field>
      ) : null}

      <Field htmlFor="auth-email" label="Email">
        <TextInput
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@studio.com"
        />
      </Field>

      <Field
        htmlFor="auth-password"
        label="Password"
        hint={register ? "At least eight characters." : undefined}
      >
        <TextInput
          id="auth-password"
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 8 : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      {error ? (
        <p role="alert" className="border-l-2 border-vermilion pl-3 text-sm text-graphite">
          {error.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Working…" : register ? "Create account" : "Sign in"}
      </Button>

      <p className="text-sm text-graphite">
        {register ? "Already have an account? " : "No account yet? "}
        <Link
          href={register ? "/sign-in" : "/sign-up"}
          className="text-ink underline decoration-vermilion decoration-2 underline-offset-4"
        >
          {register ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
