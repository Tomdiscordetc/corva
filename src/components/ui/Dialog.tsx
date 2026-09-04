import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-neutral-1000/40",
          "data-[state=open]:animate-[overlay-in_var(--t-base)_var(--ease-standard)]",
        )}
      />
      <RadixDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
          "rounded-lg border border-line bg-surface-raised p-6 shadow-[var(--shadow-overlay)] outline-none",
          "data-[state=open]:animate-[dialog-in_var(--t-base)_var(--ease-standard)]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <RadixDialog.Title className="text-base font-semibold text-text">{title}</RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-1 text-sm text-text-muted">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <button
              aria-label="Schließen"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-faint transition-colors duration-[var(--t-fast)] hover:bg-neutral-100 hover:text-text"
            >
              <X className="size-4" />
            </button>
          </RadixDialog.Close>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
