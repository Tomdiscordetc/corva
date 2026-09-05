import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from "@/demo/settings";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function storageKey(email: string) {
  return `corva.settings.notifications.${encodeURIComponent(email.trim().toLowerCase())}`;
}

/** Beschädigte/alte Browserdaten dürfen weder die Seite noch Schalter verfälschen. */
export function parseNotificationPreferences(raw: string | null): NotificationPreferences {
  const result = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return result;
    for (const key of Object.keys(result) as (keyof NotificationPreferences)[]) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "boolean") result[key] = value;
    }
  } catch {
    // Ein unlesbarer gespeicherter Entwurf startet mit den Demo-Vorgaben.
  }
  return result;
}

export function readNotificationPreferences(email: string, storage: PreferenceStorage) {
  return parseNotificationPreferences(storage.getItem(storageKey(email)));
}

export function writeNotificationPreferences(email: string, preferences: NotificationPreferences, storage: PreferenceStorage) {
  storage.setItem(storageKey(email), JSON.stringify(preferences));
}
