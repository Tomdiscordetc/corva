import type { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="text-left text-xs text-text-muted">{children}</thead>;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-line last:border-0 transition-colors duration-[var(--t-fast)] hover:bg-neutral-50",
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  const density = useUiStore((s) => s.density);
  return (
    <th
      className={cn(
        "font-medium",
        density === "compact" ? "py-2 px-3" : "py-3 px-4",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  const density = useUiStore((s) => s.density);
  return (
    <td
      className={cn(
        "text-text",
        density === "compact" ? "py-2 px-3" : "py-3.5 px-4",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}
