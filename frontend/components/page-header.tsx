import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Printed above the rule, mono and small — the section's slate. */
  kicker: string;
  title: string;
  lede?: string;
  /** Printed under the slate in small mono: counts, spend, plan. */
  meta?: readonly string[];
  aside?: ReactNode;
}

/** The single h1 for a page, with its slate and a hairline beneath. */
export function PageHeader({ kicker, title, lede, meta, aside }: PageHeaderProps) {
  return (
    <header className="border-b border-rule pt-7 pb-5 md:pt-10 md:pb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="label">{kicker}</p>
        {meta && meta.length > 0 ? <p className="meta">{meta.join("  ·  ")}</p> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="max-w-2xl">
          <h1 className="display text-[clamp(2.75rem,7.5vw,4.75rem)]">{title}</h1>
          {lede ? <p className="mt-3 max-w-xl text-[0.9375rem] text-graphite">{lede}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}
