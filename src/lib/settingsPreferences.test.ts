import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/demo/settings";
import { parseNotificationPreferences, readNotificationPreferences, writeNotificationPreferences } from "./settingsPreferences";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

describe("local settings preferences", () => {
  it("recovers from malformed browser storage and validates individual fields", () => {
    expect(parseNotificationPreferences("invalid JSON")).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(parseNotificationPreferences("null")).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(parseNotificationPreferences('{"email":true,"inquiries":"false","summary":null}')).toEqual({ ...DEFAULT_NOTIFICATION_PREFERENCES, email: true });
  });

  it("persists a preference and keeps other accounts separate", () => {
    const storage = memoryStorage();
    const chosen = { ...DEFAULT_NOTIFICATION_PREFERENCES, inquiries: false, email: true };
    writeNotificationPreferences("Design.QA@example.com", chosen, storage);
    expect(readNotificationPreferences(" design.qa@example.com ", storage)).toEqual(chosen);
    expect(readNotificationPreferences("second@example.com", storage)).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("reports storage failures so the page cannot claim a successful save", () => {
    const blocked = { ...memoryStorage(), setItem: () => { throw new Error("Storage blocked"); } };
    expect(() => writeNotificationPreferences("qa@example.com", DEFAULT_NOTIFICATION_PREFERENCES, blocked)).toThrow("Storage blocked");
  });
});
