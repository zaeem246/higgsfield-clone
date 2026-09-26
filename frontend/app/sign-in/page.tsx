import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/api.server";
import { safeNext } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Kinograde to generate images and video and keep everything you make.",
};

/** Printed where a marketing page would put a testimonial. */
const SESSION_FACTS: readonly [string, string][] = [
  ["Session", "httpOnly cookie"],
  ["Readable by JS", "no"],
  ["Local storage", "empty"],
  ["Issued by", "the gateway"],
];

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const me = await currentAccount();
  if (me.ok) redirect(next);

  return (
    <div className="shell grid items-start gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-16">
      <div>
        <p className="label">Account</p>
        <h1 className="display mt-2.5 text-[clamp(2.75rem,7vw,4.25rem)]">Welcome back.</h1>
        <p className="mt-3 max-w-sm text-[0.9375rem] leading-snug text-graphite">
          Sign in to generate images and video, and to pick up everything you have already made.
        </p>
        <p className="mt-3 max-w-sm text-[0.9375rem] leading-snug text-graphite">
          Your session is held in a cookie this page cannot read — it belongs to the gateway. That
          is deliberate: no token ever reaches the browser&rsquo;s JavaScript.
        </p>
        <dl className="mt-5 max-w-sm">
          {SESSION_FACTS.map(([term, value]) => (
            <div
              key={term}
              className="flex justify-between gap-4 border-t border-rule py-1.5 last:border-b"
            >
              <dt className="label">{term}</dt>
              <dd className="meta text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border border-rule bg-raised p-5 md:p-6">
        <AuthForm mode="sign-in" next={next} />
      </div>
    </div>
  );
}
