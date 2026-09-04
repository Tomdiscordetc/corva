import de from "./de.json";

type Dict = typeof de;

/** Holt einen verschachtelten Wert per Punktpfad, z. B. "auth.login.title". */
function resolve(dict: Dict, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

/**
 * Minimaler Sprachlader für Abschnitt 1: nur Deutsch ist sichtbar, aber kein
 * Text steht direkt im Code. `{{platzhalter}}` wird ersetzt, falls vorhanden.
 * Wird später durch echtes i18n-Umschalten (de/en) ersetzt — Aufrufstellen
 * bleiben dabei unverändert.
 */
export function t(path: string, vars?: Record<string, string | number>): string {
  const value = resolve(de, path);
  if (typeof value !== "string") {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] fehlender Text für "${path}"`);
    }
    return path;
  }
  if (!vars) return value;
  return value.replace(/\{\{(.*?)\}\}/g, (_, key: string) => String(vars[key.trim()] ?? ""));
}
