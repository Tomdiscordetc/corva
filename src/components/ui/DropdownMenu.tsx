import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={8}
        className={cn(
          "z-50 min-w-48 rounded-md border border-line bg-surface-raised p-1.5 shadow-[var(--shadow-overlay)]",
          "data-[state=open]:animate-[menu-in_var(--t-fast)_var(--ease-standard)]",
          className,
        )}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  destructive,
  disabled,
}: {
  children: ReactNode;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <RadixDropdown.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-sm outline-none select-none",
        "data-[highlighted]:bg-surface-hover data-[disabled]:cursor-default data-[disabled]:opacity-60",
        destructive ? "text-danger" : "text-text",
      )}
    >
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pt-2 pb-1 text-2xs font-medium text-text-faint">{children}</div>;
}

export function DropdownMenuSeparator() {
  return <RadixDropdown.Separator className="my-1.5 h-px bg-line" />;
}

export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
}: {
  children: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <RadixDropdown.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-sm text-text outline-none select-none",
        "data-[highlighted]:bg-surface-hover",
      )}
    >
      <span className="flex size-3.5 items-center justify-center">
        <RadixDropdown.ItemIndicator>
          <Check className="size-3.5" strokeWidth={3} />
        </RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.CheckboxItem>
  );
}
