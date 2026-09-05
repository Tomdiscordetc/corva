import { useState } from "react";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { useUiStore, type Density } from "@/store/ui";
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreference, type NotificationPreferences } from "@/demo/settings";
import { readNotificationPreferences, writeNotificationPreferences } from "@/lib/settingsPreferences";

/** Lokale Einstellungen; keine Abhängigkeit vom noch nicht vorhandenen Server. */
export function useSettings(email: string) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const contextPanelOpen = useUiStore((s) => s.contextPanelOpen);
  const toggleContextPanel = useUiStore((s) => s.toggleContextPanel);
  const showShortcuts = useUiStore((s) => s.setShortcutsHelpOpen);
  const [feedback, setFeedback] = useState<"idle" | "saved" | "error">("idle");
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => {
    try {
      return readNotificationPreferences(email, window.localStorage);
    } catch {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
  });

  function save(action: () => void) {
    try {
      action();
      setFeedback("saved");
    } catch {
      setFeedback("error");
    }
  }

  function changeNotification(key: NotificationPreference, value: boolean) {
    const next = { ...notifications, [key]: value };
    save(() => {
      writeNotificationPreferences(email, next, window.localStorage);
      setNotifications(next);
    });
  }

  return {
    theme, density, contextPanelOpen, notifications, feedback,
    changeTheme: (value: ThemeChoice) => save(() => setTheme(value)),
    changeDensity: (value: Density) => save(() => setDensity(value)),
    changeContextPanel: (value: boolean) => {
      if (value !== contextPanelOpen) save(toggleContextPanel);
    },
    changeNotification,
    showShortcuts: () => showShortcuts(true),
  };
}
