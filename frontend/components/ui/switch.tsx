interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** `role="switch"` with a real label association, keyboard-operable as a button. */
export function Switch({ id, checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-45 ${
          checked ? "border-vermilion bg-vermilion" : "border-rule bg-sunk"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 size-3.5 rounded-full transition-[left] duration-150 ${
            checked ? "left-4 bg-vermilion-ink" : "left-0.5 bg-graphite"
          }`}
        />
      </button>
      <label id={`${id}-label`} htmlFor={id} className="text-sm text-ink select-none">
        {label}
      </label>
    </div>
  );
}
