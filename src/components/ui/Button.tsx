import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-invert text-on-invert hover:bg-invert-hover active:bg-invert-active disabled:bg-line disabled:text-text-faint",
  secondary:
    "bg-surface text-text border border-line-strong hover:bg-surface-subtle active:bg-surface-hover disabled:text-text-faint disabled:border-line",
  ghost:
    "bg-transparent text-text hover:bg-surface-hover active:bg-surface-press disabled:text-text-faint",
  danger:
    "bg-danger text-neutral-0 hover:brightness-95 active:brightness-90 disabled:bg-line disabled:text-text-faint",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-sm",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-5 text-base gap-2 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium select-none",
        "transition-[background-color,color,transform,box-shadow] duration-[var(--t-fast)] ease-[var(--ease-standard)]",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
