import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-[2px] border border-rule bg-sunk px-2.5 py-2 text-sm text-ink " +
  "placeholder:text-graphite transition-colors focus:border-vermilion focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-vermilion " +
  "disabled:cursor-not-allowed disabled:opacity-55";

interface FieldProps {
  /** Must match the control's id — every input here is explicitly labelled. */
  htmlFor: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ htmlFor, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label block">
        {label}
      </label>
      {children}
      {hint ? <p className="meta">{hint}</p> : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

export function TextInput({ className = "", ...rest }: TextInputProps) {
  return <input className={`${CONTROL} ${className}`.trim()} {...rest} />;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
}

export function TextArea({ className = "", ...rest }: TextAreaProps) {
  return (
    <textarea
      className={`${CONTROL} resize-none leading-relaxed ${className}`.trim()}
      {...rest}
    />
  );
}
