import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, label, id, disabled }: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full bg-neutral-200 outline-none",
          "transition-colors duration-[var(--t-fast)] ease-[var(--ease-standard)]",
          "data-[state=checked]:bg-neutral-950",
          "focus-visible:ring-4 focus-visible:ring-accent-tint",
          "disabled:opacity-40",
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "block size-4.5 translate-x-1 rounded-full bg-neutral-0 shadow-[var(--shadow-soft)]",
            "transition-transform duration-[var(--t-fast)] ease-[var(--ease-standard)]",
            "data-[state=checked]:translate-x-[1.15rem]",
          )}
        />
      </RadixSwitch.Root>
      {label && (
        <label htmlFor={id} className="text-sm text-text select-none">
          {label}
        </label>
      )}
    </div>
  );
}
