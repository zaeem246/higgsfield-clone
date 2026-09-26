import Link from "next/link";

interface Column {
  heading: string;
  links: { href: string; label: string }[];
}

function columns(signedIn: boolean): Column[] {
  return [
    {
      heading: "Make something",
      links: [
        { href: "/create", label: "Create" },
        { href: "/my-work", label: "My work" },
        { href: "/styles", label: "Styles & camera moves" },
      ],
    },
    {
      heading: "Look around",
      links: [
        { href: "/gallery", label: "Gallery" },
        { href: "/pricing", label: "Pricing" },
      ],
    },
    {
      heading: "Account",
      // Offering "create an account" to someone already holding one reads as a
      // site that has not noticed them.
      links: signedIn
        ? [
            { href: "/my-work", label: "My work" },
            { href: "/pricing", label: "Your plan" },
          ]
        : [
            { href: "/sign-in", label: "Sign in" },
            { href: "/sign-up", label: "Create an account" },
          ],
    },
  ];
}

export function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="mt-12 border-t border-rule">
      <div className="shell grid gap-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="size-2.5 bg-vermilion" />
            <span className="font-display text-2xl leading-none">Kinograde</span>
          </div>
          <p className="mt-2 max-w-xs text-[0.875rem] leading-snug text-graphite">
            Generates images and video from a prompt. You pick the film stock, the colour, the
            lighting, the effect and the camera move — so you direct the shot instead of guessing
            at it.
          </p>
        </div>

        {columns(signedIn).map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="label mb-2">{column.heading}</p>
            <ul className="space-y-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.875rem] text-graphite hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-rule">
        <div className="shell flex flex-wrap items-center justify-between gap-2 py-3 font-mono text-[0.6875rem] tracking-[0.12em] text-graphite uppercase">
          <span>Kinograde — AI image &amp; video generation</span>
          <span>Frontend · Gateway · Django</span>
        </div>
      </div>
    </footer>
  );
}
