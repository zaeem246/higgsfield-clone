import type { ReactNode } from "react";

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  /**
   * Called with `true` while the chip is under the pointer or holds focus.
   * The camera rail uses it to play the move on the preview plate before the
   * reader has committed to it — try it on, then keep it.
   */
  onPreview?: (active: boolean) => void;
  children: ReactNode;
}

/**
 * A preset toggle. `aria-pressed` rather than a checkbox, because visually it
 * is a stamp on the shot list rather than a form control — and it behaves like
 * one: it depresses under the press and settles with a short overshoot. What a
 * chip adds to the prompt is printed under the rail, not held in a tooltip.
 */
export function Chip({ selected, onClick, onPreview, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      onPointerEnter={onPreview ? () => onPreview(true) : undefined}
      onPointerLeave={onPreview ? () => onPreview(false) : undefined}
      onFocus={onPreview ? () => onPreview(true) : undefined}
      onBlur={onPreview ? () => onPreview(false) : undefined}
      className={`chip rounded-[2px] border px-2.5 py-1 text-[0.8125rem] whitespace-nowrap ${
        selected
          ? "border-vermilion bg-vermilion text-vermilion-ink"
          : "border-rule bg-raised text-ink hover:border-graphite"
      }`}
    >
      {children}
    </button>
  );
}
