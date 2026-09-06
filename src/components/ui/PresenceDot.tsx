import type { CSSProperties, ReactNode } from "react";
import { PRESENCE_COLOR_VAR, type PresenceStatus } from "@/lib/presence";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

/** Punktgröße und Abstand zum Bild, abgestimmt auf die Avatargrößen. */
const SIZES = {
  sm: { size: "9px", gap: "2px" },
  md: { size: "11px", gap: "2.5px" },
  lg: { size: "14px", gap: "3px" },
} as const;

export type PresenceSize = keyof typeof SIZES;

function presenceVars(status: PresenceStatus, size: PresenceSize): CSSProperties {
  return {
    "--presence-color": `var(${PRESENCE_COLOR_VAR[status]})`,
    "--presence-size": SIZES[size].size,
    "--presence-gap": SIZES[size].gap,
  } as CSSProperties;
}

/**
 * Profilbild mit Anwesenheitspunkt. Der Punkt sitzt ausschließlich hier —
 * eine zweite Anzeige daneben wäre doppelt gemoppelt. Wo kein Statustext
 * danebensteht, trägt die Beschriftung des Punktes die Aussage, damit sie
 * nicht allein an der Farbe hängt.
 */
export function PresenceAvatar({
  status,
  size = "sm",
  children,
  className,
}: {
  status: PresenceStatus;
  size?: PresenceSize;
  children: ReactNode;
  className?: string;
}) {
  const label = t(`presence.${status}`);

  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={presenceVars(status, size)}>
      {/* Das Bild bekommt an der Punktstelle ein echtes Loch statt eines Rings. */}
      <span className="presence-cutout inline-flex">{children}</span>
      <span
        role="img"
        aria-label={label}
        title={label}
        data-status={status}
        className="presence-dot presence-dot--on-avatar"
      />
    </span>
  );
}

/**
 * Freistehender Punkt — nur dort, wo kein Profilbild in der Nähe ist,
 * etwa als Vorschau im Statusmenü.
 */
export function PresenceDot({
  status,
  size = "sm",
  className,
}: {
  status: PresenceStatus;
  size?: PresenceSize;
  className?: string;
}) {
  const label = t(`presence.${status}`);

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-status={status}
      style={presenceVars(status, size)}
      className={cn("presence-dot", className)}
    />
  );
}
