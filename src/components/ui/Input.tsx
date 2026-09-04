import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Markiert das Feld als fehlerhaft, ohne eine eigene Meldung darunter zu
   *  setzen — für Formulare mit einer gemeinsamen Meldung über mehrere Felder. */
  invalid?: boolean;
  hint?: string;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, invalid, hint, trailing, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isInvalid = !!error || !!invalid;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={isInvalid}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-md border bg-surface px-3.5 text-sm text-text placeholder:text-text-faint",
            "transition-[border-color,box-shadow] duration-[var(--t-fast)] ease-[var(--ease-standard)]",
            "border-line-strong outline-none",
            "focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent-tint",
            isInvalid && "border-danger focus-visible:border-danger focus-visible:ring-danger-tint",
            trailing && "pr-10",
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-3 flex items-center text-text-faint">
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-text-faint">
          {hint}
        </p>
      )}
    </div>
  );
});
