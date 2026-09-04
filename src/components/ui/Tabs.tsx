import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <RadixTabs.List className={cn("flex gap-5 border-b border-line", className)}>
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={cn(
        "relative -mb-px border-b-2 border-transparent py-2.5 text-sm font-medium text-text-muted outline-none",
        "transition-colors duration-[var(--t-fast)] ease-[var(--ease-standard)]",
        "hover:text-text",
        "data-[state=active]:border-invert data-[state=active]:text-text",
        "focus-visible:rounded-sm focus-visible:ring-4 focus-visible:ring-accent-tint",
      )}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

export const TabsContent = RadixTabs.Content;
