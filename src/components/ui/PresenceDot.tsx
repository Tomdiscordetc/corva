import { PRESENCE_STYLES, type PresenceStatus } from "@/lib/presence";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

interface PresenceDotProps {
  status: PresenceStatus;
  size?: "sm" | "md";
  /** Auf Avataren: ringförmig freigestellt, damit der Punkt sich abhebt. */
  onAvatar?: boolean;
  className?: string;
}

const SIZES = { sm: "size-2", md: "size-2.5" };

/**
 * Leuchtender Punkt für die Anwesenheit. Die Farbe allein trägt die Aussage
 * nicht — jeder Punkt hat eine Textfassung für Screenreader und als Kurzinfo
 * beim Überfahren, weil Rot und Grün für viele nicht unterscheidbar sind.
 */
export function PresenceDot({ status, size = "sm", onAvatar = false, className }: PresenceDotProps) {
  const style = PRESENCE_STYLES[status];
  const label = t(`presence.${status}`);

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "block shrink-0 rounded-full",
        SIZES[size],
        style.dotClass,
        style.glowClass,
        onAvatar && "absolute right-0 bottom-0 ring-2 ring-surface",
        className,
      )}
    />
  );
}

/** Avatar-Umhüllung, die den Punkt an der richtigen Stelle hält. */
export function PresenceAvatar({
  status,
  children,
  className,
}: {
  status: PresenceStatus;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {children}
      <PresenceDot status={status} onAvatar />
    </span>
  );
}
