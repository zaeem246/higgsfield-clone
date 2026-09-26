"use client";

import { useId } from "react";

export interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface OptionGroupProps<T extends string | number> {
  legend: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  hint?: string;
}

/**
 * A row of mutually exclusive choices built on real radio inputs, so arrow-key
 * navigation, grouping and announcement all come from the platform rather than
 * being re-implemented with aria attributes.
 */
export function OptionGroup<T extends string | number>({
  legend,
  value,
  options,
  onChange,
  hint,
}: OptionGroupProps<T>) {
  const name = useId();

  return (
    <fieldset>
      <legend className="label mb-1.5">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = option.value === value;
          return (
            <div key={String(option.value)}>
              <input
                type="radio"
                id={id}
                name={name}
                value={String(option.value)}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={`chip block cursor-pointer rounded-[2px] border px-2.5 py-1 font-mono text-[0.8125rem] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vermilion ${
                  selected
                    ? "border-vermilion bg-vermilion text-vermilion-ink"
                    : "border-rule bg-raised text-ink hover:border-graphite"
                }`}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      {hint ? <p className="meta mt-1.5">{hint}</p> : null}
    </fieldset>
  );
}
