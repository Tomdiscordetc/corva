import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "warning" | "danger";

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  accent: "bg-accent-tint text-accent-text",
  positive: "bg-positive-tint text-positive",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
};

export function StatusPill({ tone = "neutral", className, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
