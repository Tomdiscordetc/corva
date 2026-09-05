import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  /** Blendet die Beschriftung optisch aus, lässt sie aber vorlesbar. */
  hideLabel?: boolean;
  options: SelectOption[];
  error?: string;
}

/**
 * Auswahlfeld auf Basis des nativen <select>: übernimmt Tastaturbedienung,
 * Vorlesen und die Auswahlrollen des Systems — auf dem Handy erscheint das
 * gewohnte Rad statt einer nachgebauten Liste.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hideLabel = false, options, error, id, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className={cn("text-xs font-medium text-text-muted", hideLabel && "sr-only")}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full appearance-none rounded-md border bg-surface pr-9 pl-3.5 text-sm text-text",
            "transition-[border-color,box-shadow] duration-[var(--t-fast)] ease-[var(--ease-standard)]",
            "border-line-strong outline-none",
            "focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent-tint",
            error && "border-danger focus-visible:border-danger focus-visible:ring-danger-tint",
            "disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-faint" />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});
