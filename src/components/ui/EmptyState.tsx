import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100 text-text-faint">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
