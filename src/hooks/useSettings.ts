import { useState } from "react";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { useUiStore, type Density } from "@/store/ui";
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreference, type NotificationPreferences } from "@/demo/settings";
import { readNotificationPreferences, writeNotificationPreferences } from "@/lib/settingsPreferences";
import { SERVER_MODE } from "@/lib/api";
import { useRemotePreferences, type PreferencesPatch } from "./useRemotePreferences";
import { toast } from "@/components/ui/Toast";

/** Lokale Einstellungen; keine Abhängigkeit vom noch nicht vorhandenen Server. */
export function useSettings(email: string) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const contextPanelOpen = useUiStore((s) => s.contextPanelOpen);
  const toggleContextPanel = useUiStore((s) => s.toggleContextPanel);
  const showShortcuts = useUiStore((s) => s.setShortcutsHelpOpen);
  const remote = useRemotePreferences(email);
  const [feedback, setFeedback] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => {
    try {
      return readNotificationPreferences(email, window.localStorage);
    } catch {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
  });

  function save(action: () => void, expected?: { key: string; field: string; value: string | boolean }) {
    try {
      action();
      // Zustand kann bei bereits beim Start gesperrtem Speicher still auf
      // flüchtigen Zustand zurückfallen. Erfolg erst nach tatsächlichem Lesen.
      if (expected) {
        const persisted = JSON.parse(window.localStorage.getItem(expected.key) ?? "null");
        if (persisted?.state?.[expected.field] !== expected.value) throw new Error("Preference was not persisted");
      }
      setFeedback("saved");
      setErrorMessage("");
      return true;
    } catch {
      setFeedback("error");
      return false;
    }
  }

  async function saveRemote(patch: PreferencesPatch) {
    setFeedback("idle");
    setErrorMessage("");
    try {
      await remote.save(patch);
      setFeedback("saved");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "");
      if (error instanceof Error) toast.error(error.message);
      setFeedback("error");
      return false;
    }
  }

  function changeNotification(key: NotificationPreference, value: boolean) {
    if (SERVER_MODE) return saveRemote({ notifications: { [key]: value } });
    const next = { ...notifications, [key]: value };
    return save(() => {
      writeNotificationPreferences(email, next, window.localStorage);
      setNotifications(next);
    });
  }

  return {
    theme: SERVER_MODE ? remote.data?.theme ?? theme : theme,
    density: SERVER_MODE ? remote.data?.density ?? density : density,
    contextPanelOpen: SERVER_MODE ? remote.data?.contextPanelOpen ?? contextPanelOpen : contextPanelOpen,
    notifications: SERVER_MODE ? remote.data?.notifications ?? notifications : notifications,
    feedback, errorMessage,
    loading: SERVER_MODE && remote.isPending,
    busy: SERVER_MODE && remote.pending,
    loadError: SERVER_MODE && remote.error ? remote.error.message : null,
    retry: () => { void remote.refetch(); },
    changeTheme: (value: ThemeChoice) => SERVER_MODE ? saveRemote({ theme: value }) : save(() => setTheme(value), { key: "corva.theme", field: "theme", value }),
    changeDensity: (value: Density) => SERVER_MODE ? saveRemote({ density: value }) : save(() => setDensity(value), { key: "corva.ui", field: "density", value }),
    changeContextPanel: (value: boolean) => {
      if (SERVER_MODE) return saveRemote({ contextPanelOpen: value });
      if (value !== contextPanelOpen) save(toggleContextPanel, { key: "corva.ui", field: "contextPanelOpen", value });
    },
    changeNotification,
    showShortcuts: () => showShortcuts(true),
  };
}
