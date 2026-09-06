/**
 * Anwesenheit im Team. Bewusst drei Stufen — mehr lässt sich auf einen Blick
 * nicht unterscheiden, und jede Stufe hat eine klare Handlungsfolge:
 * ansprechbar, später ansprechen, nicht stören.
 */
export type PresenceStatus = "frei" | "beschaeftigt" | "abwesend";

export const PRESENCE_ORDER: PresenceStatus[] = ["frei", "beschaeftigt", "abwesend"];

export interface PresenceStyle {
  /** Farb-Token aus theme.css — nie eine feste Farbe im Baustein. */
  dotClass: string;
  glowClass: string;
}

export const PRESENCE_STYLES: Record<PresenceStatus, PresenceStyle> = {
  frei: { dotClass: "bg-presence-free", glowClass: "presence-glow-free" },
  beschaeftigt: { dotClass: "bg-presence-busy", glowClass: "presence-glow-busy" },
  abwesend: { dotClass: "bg-presence-away", glowClass: "presence-glow-away" },
};

/**
 * Ordnet freie Statustexte einer Stufe zu. Die Demo-Daten und später der
 * Kalender liefern Formulierungen wie „im Termin" — die sollen nicht als
 * unbekannt durchfallen.
 */
export function presenceFromLabel(label: string): PresenceStatus {
  const value = label.trim().toLowerCase();
  if (["aktiv", "frei", "verfügbar", "online"].includes(value)) return "frei";
  if (["abwesend", "pause", "offline", "urlaub"].includes(value)) return "abwesend";
  if (value.includes("termin") || value.includes("gespräch") || value.includes("telefon")) {
    return "beschaeftigt";
  }
  // Unbekanntes gilt als beschäftigt: lieber einmal zu viel Rücksicht nehmen,
  // als jemanden mitten im Kundengespräch anzurufen.
  return "beschaeftigt";
}
