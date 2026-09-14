import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Small shared primitives. Kept in one file — there aren't enough to split. */

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink-100 text-ink-950 hover:bg-white disabled:bg-ink-600 disabled:text-ink-400",
  ghost: "text-ink-300 hover:text-ink-100 hover:bg-ink-800",
  outline:
    "border border-ink-700 text-ink-100 hover:border-ink-500 hover:bg-ink-850",
  danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[6px] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[8px] gap-2",
  lg: "h-12 px-6 text-[15px] rounded-[10px] gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "live";
}) {
  const tones = {
    neutral: "bg-ink-750 text-ink-300",
    accent: "bg-acid/15 text-acid",
    live: "bg-emerald-400/15 text-emerald-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Selectable pill used across the preset pickers. */
export function Chip({
  active,
  children,
  onClick,
  title,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150 ${
        active
          ? "border-acid bg-acid/12 text-acid"
          : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100"
      }`}
    >
      {children}
    </button>
  );
}

export function CreditPill({ credits }: { credits: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850 px-3 py-1.5 text-[13px] font-medium tabular-nums">
      <Icon name="spark" className="h-3.5 w-3.5 text-acid" />
      {credits.toLocaleString()}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
          {label}
        </span>
        {hint && <span className="text-[11px] text-ink-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-ink-700 px-6 py-20 text-center">
      <p className="text-lg font-medium text-ink-100">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-ink-400">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- icons */

const PATHS: Record<string, ReactNode> = {
  spark: <path d="M12 2l2.2 6.3L21 10.5l-6.8 2.2L12 19l-2.2-6.3L3 10.5l6.8-2.2z" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M3 16.5l5-4 4.5 3.5L16 13l5 4" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="5.5" width="13" height="13" rx="2" />
      <path d="M15.5 10.5l6-3.5v10l-6-3.5z" />
    </>
  ),
  camera: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v5M21 12h-5M12 21v-5M3 12h5" />
    </>
  ),
  wand: (
    <>
      <path d="M4 20L16 8" />
      <path d="M18 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      <path d="M6 4l.7 2L9 6.7 6.7 7.4 6 9.7 5.3 7.4 3 6.7 5.3 6z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.5-7-9.2A3.8 3.8 0 0112 8a3.8 3.8 0 017 2.8c0 4.7-7 9.2-7 9.2z" />
  ),
  recreate: (
    <>
      <path d="M20 12a8 8 0 10-2.3 5.7" />
      <path d="M20 6v5h-5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12.5l5 5 11-11" />,
  chevron: <path d="M8 4l8 8-8 8" />,
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  "sound-on": (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 010 7" />
      <path d="M19 6a8.5 8.5 0 010 12" />
    </>
  ),
  "sound-off": (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 9.5l4 5M21 9.5l-4 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: keyof typeof PATHS | string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
