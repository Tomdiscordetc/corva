import { cn } from "@/lib/cn";

/** Corva „Cut“: ein gefülltes C mit zwei parallelen diagonalen Abschlüssen. */
export const CORVA_MARK_PATH = "M55 10H28C16.954 10 8 18.954 8 30V34C8 45.046 16.954 54 28 54H43L55 42H29C24.029 42 20 37.971 20 33V31C20 26.029 24.029 22 29 22H43L55 10Z";

export function CorvaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={cn("size-6", className)} aria-hidden>
      <path d={CORVA_MARK_PATH} />
    </svg>
  );
}
