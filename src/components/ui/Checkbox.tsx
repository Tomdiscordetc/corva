import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  /** Beschriftung für Fälle ohne sichtbares Label, etwa in Listenzeilen. */
  "aria-label"?: string;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, label, id, className, ...props }: CheckboxProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RadixCheckbox.Root
        id={id}
        aria-label={props["aria-label"]}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className={cn(
          "flex size-5 items-center justify-center rounded-[6px] border border-line-strong bg-surface outline-none",
          "transition-colors duration-[var(--t-fast)] ease-[var(--ease-standard)]",
          "data-[state=checked]:border-invert data-[state=checked]:bg-invert",
          "focus-visible:ring-4 focus-visible:ring-accent-tint",
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="size-3.5 text-on-invert" strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label htmlFor={id} className="text-sm text-text select-none">
          {label}
        </label>
      )}
    </div>
  );
}
