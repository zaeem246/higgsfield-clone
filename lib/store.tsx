"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PLAN_CREDITS, type Account, type Generation } from "./types";

/**
 * Client-side persistence.
 *
 * Deliberately not a database. The live link has to work for anyone who opens
 * it, with no provisioning and no state leaking between strangers, so an
 * account and its generations live in that visitor's own browser. Swapping this
 * module for a server-backed one is the only change needed to make accounts
 * real — every consumer goes through `useStore()`.
 *
 * localStorage is an external system, so it is read through
 * `useSyncExternalStore` rather than copied into component state by an effect.
 * That keeps the server render and the first client render in agreement (both
 * see EMPTY) and lets React re-render once, after hydration, with the real data.
 */

const KEY = "higgsfield.state.v1";

interface Persisted {
  account: Account | null;
  generations: Generation[];
  likes: string[];
  /** False until localStorage has been read, so the UI can hold off. */
  ready: boolean;
}

const EMPTY: Persisted = { account: null, generations: [], likes: [], ready: false };

let snapshot: Persisted = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;

  let next: Persisted = { ...EMPTY, ready: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      next = {
        account: parsed.account ?? null,
        generations: Array.isArray(parsed.generations) ? parsed.generations : [],
        likes: Array.isArray(parsed.likes) ? parsed.likes : [],
        ready: true,
      };
    }
  } catch {
    /* corrupt or unavailable storage: start clean rather than crash */
  }

  snapshot = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Runs inside an effect, so this is the first point where localStorage exists.
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
/** Stable reference: React compares these across the hydration boundary. */
const getServerSnapshot = () => EMPTY;

function update(fn: (state: Persisted) => Persisted) {
  snapshot = fn(snapshot);
  try {
    const { account, generations, likes } = snapshot;
    localStorage.setItem(KEY, JSON.stringify({ account, generations, likes }));
  } catch {
    /* quota or private mode: the session still works, it just won't persist */
  }
  emit();
}

/* ----------------------------------------------------------------- actions */

function newAccount(name: string, email: string): Account {
  return {
    id: `u_${Date.now().toString(36)}`,
    name: name.trim() || email.split("@")[0],
    email: email.trim(),
    plan: "free",
    credits: PLAN_CREDITS.free,
    createdAt: Date.now(),
  };
}

const actions = {
  signUp(name: string, email: string) {
    update((s) => ({ ...s, account: newAccount(name, email) }));
  },

  // No passwords: this is a demo account, and pretending otherwise would imply
  // a security guarantee that isn't here.
  signIn(email: string) {
    update((s) =>
      s.account?.email === email.trim()
        ? s
        : { ...s, account: newAccount("", email) }
    );
  },

  signOut() {
    update(() => ({ ...EMPTY, ready: true }));
  },

  setPlan(plan: Account["plan"]) {
    update((s) =>
      s.account
        ? { ...s, account: { ...s.account, plan, credits: PLAN_CREDITS[plan] } }
        : s
    );
  },

  grantCredits(n: number) {
    update((s) =>
      s.account ? { ...s, account: { ...s.account, credits: s.account.credits + n } } : s
    );
  },

  addGenerations(items: Generation[], cost: number) {
    update((s) => ({
      ...s,
      generations: [...items, ...s.generations],
      account: s.account
        ? { ...s.account, credits: Math.max(0, s.account.credits - cost) }
        : s.account,
    }));
  },

  updateGeneration(id: string, patch: Partial<Generation>) {
    update((s) => ({
      ...s,
      generations: s.generations.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  },

  /** Removing a failed render refunds it — you should not pay for our error. */
  removeGeneration(id: string) {
    update((s) => {
      const target = s.generations.find((g) => g.id === id);
      const refund = target?.status === "failed" ? target.credits : 0;
      return {
        ...s,
        generations: s.generations.filter((g) => g.id !== id),
        account:
          s.account && refund
            ? { ...s.account, credits: s.account.credits + refund }
            : s.account,
      };
    });
  },

  toggleLike(id: string) {
    update((s) => ({
      ...s,
      likes: s.likes.includes(id)
        ? s.likes.filter((x) => x !== id)
        : [...s.likes, id],
    }));
  },
};

export type StoreValue = Persisted & typeof actions;

export function useStore(): StoreValue {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => ({ ...state, ...actions }), [state]);
}
