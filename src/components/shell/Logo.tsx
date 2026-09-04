import { cn } from "@/lib/cn";

export const CORVA_LOGO_PATHS = [
  "M28 10.5C25.8 8.3 22.9 7 19.7 7 12.7 7 7 12.7 7 19.7s5.7 12.7 12.7 12.7c3.2 0 6.1-1.2 8.3-3.2",
  "M13 21.3c1.9 3.6 5.7 6 10 6 6.2 0 11.3-5.1 11.3-11.3S29.2 4.7 23 4.7c-2.8 0-5.4 1-7.4 2.8",
] as const;

/** Corva-Signet aus zwei ineinandergreifenden Bögen. */
export function Logo({
  className,
  accentClassName,
}: {
  className?: string;
  accentClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("size-6", className)}
      aria-hidden
    >
      <path
        d={CORVA_LOGO_PATHS[0]}
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d={CORVA_LOGO_PATHS[1]}
        className={accentClassName}
        stroke={accentClassName ? "currentColor" : "var(--color-accent)"}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Kompakter Marken-Lockup für Login und Navigation. */
export function LogoLockup({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)} aria-label="Corva">
      <Logo className={cn("size-8", markClassName)} />
      <span className="text-lg font-semibold tracking-tight">corva</span>
    </div>
  );
}
