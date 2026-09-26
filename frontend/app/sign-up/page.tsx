import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/api.server";
import { safeNext } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free Kinograde account and start generating images and video.",
};

const POINTS: readonly string[] = [
  "Generate images and video from a prompt you direct.",
  "See the finished prompt and its price before you spend.",
  "Keep everything you make, with the settings that made it.",
];

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const me = await currentAccount();
  if (me.ok) redirect(next);

  return (
    <div className="shell grid items-start gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-16">
      <div>
        <p className="label">Account</p>
        <h1 className="display mt-2.5 text-[clamp(2.75rem,7vw,4.25rem)]">
          Start making things.
        </h1>
        <p className="mt-3 max-w-sm text-[0.9375rem] leading-snug text-graphite">
          A free account. No card, and you keep everything you generate.
        </p>
        <ul className="mt-5 space-y-2">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-3 border-t border-rule pt-2 text-[0.875rem] text-graphite">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 bg-vermilion" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-rule bg-raised p-5 md:p-6">
        <AuthForm mode="sign-up" next={next} />
      </div>
    </div>
  );
}
