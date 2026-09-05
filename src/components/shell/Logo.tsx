import { cn } from "@/lib/cn";
import { CorvaMark } from "@/components/brand/CorvaMark";

/** Einfarbiges Corva-Signet; dieselbe Geometrie in Login, App und Export. */
export function Logo({
  className,
  accentClassName,
}: {
  className?: string;
  accentClassName?: string;
}) {
  return <CorvaMark className={cn(accentClassName, className)} />;
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
