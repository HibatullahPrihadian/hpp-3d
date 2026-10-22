import type { ChangeEvent } from "react";

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  step?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  prefix,
  suffix,
  placeholder,
  inputMode = "decimal",
  step = "any",
}: NumberFieldProps) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 dark:text-slate-400">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          className={`field-input ${prefix ? "pl-10" : ""} ${suffix ? "pr-12" : ""} ${
            error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/25" : ""
          }`}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          step={step}
          type="text"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
