import type { ReactNode } from "react";
import type { ApiError } from "@/lib/types";
import { UNREACHABLE } from "@/lib/types";

interface NoticeProps {
  title: string;
  children?: ReactNode;
  tone?: "neutral" | "alert";
}

/** A ruled block used wherever the page has nothing real to show. */
export function Notice({ title, children, tone = "neutral" }: NoticeProps) {
  return (
    <div
      className={`rounded-[2px] border border-l-2 px-4 py-4 ${
        tone === "alert"
          ? "border-vermilion/50 border-l-vermilion bg-vermilion/8"
          : "border-rule border-l-rule bg-raised"
      }`}
    >
      <p className={`label mb-1.5 ${tone === "alert" ? "text-vermilion" : ""}`}>
        {tone === "alert" ? "Unavailable" : "Nothing here yet"}
      </p>
      <p className="font-display text-[1.375rem] leading-tight text-ink">{title}</p>
      {children ? (
        <div className="mt-1.5 text-[0.875rem] leading-snug text-graphite">{children}</div>
      ) : null}
    </div>
  );
}

/**
 * The honest failure state. The backend and gateway deploy separately, so the
 * frontend has to be able to say "this is not live" rather than inventing
 * plausible data.
 */
export function ApiNotice({ error }: { error: ApiError }) {
  const down = error.code === UNREACHABLE || error.status >= 500;
  return (
    <Notice tone="alert" title={down ? "The Kinograde API is not responding." : error.message}>
      {down ? (
        <p>
          The gateway at this deployment is unreachable, so nothing can be loaded. This page is
          showing you the truth rather than placeholder content. Try again once the API is up.
        </p>
      ) : (
        <p className="meta tracking-widest uppercase">
          {error.code} · {error.status || "network"}
        </p>
      )}
    </Notice>
  );
}
