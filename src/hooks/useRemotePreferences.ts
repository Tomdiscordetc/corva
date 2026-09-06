import { useEffect } from "react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, SERVER_MODE } from "@/lib/api";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { useUiStore, type Density } from "@/store/ui";
import type { NotificationPreferences } from "@/demo/settings";

export interface ServerPreferences {
  theme: ThemeChoice;
  density: Density;
  contextPanelOpen: boolean;
  notifications: NotificationPreferences;
}
export type PreferencesPatch = Partial<Omit<ServerPreferences, "notifications">> & { notifications?: Partial<NotificationPreferences> };

export function useRemotePreferences(email: string) {
  const client = useQueryClient();
  const key = ["server-settings", email];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => api<ServerPreferences>("/settings", { signal }),
    enabled: SERVER_MODE && !!email,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const mutation = useMutation({
    mutationKey: key,
    scope: { id: `settings:${email}` },
    mutationFn: (patch: PreferencesPatch) => api<ServerPreferences>("/settings", { method: "PATCH", body: patch }),
    onSuccess: (settings) => {
      client.setQueryData(key, settings);
      void client.invalidateQueries({ queryKey: ["server-notifications", email] });
    },
  });
  const pending = useIsMutating({ mutationKey: key }) > 0;

  useEffect(() => {
    if (!SERVER_MODE || !query.data) return;
    const { theme, density, contextPanelOpen } = query.data;
    // Browser-Speicher ist nur ein Darstellungscache; maßgeblich ist der Server.
    // Gesperrter localStorage darf erfolgreich gespeicherte Serverwerte nicht verwerfen.
    try { useThemeStore.getState().setTheme(theme); } catch { /* Zustand wurde bereits gesetzt. */ }
    try { useUiStore.getState().setDensity(density); } catch { /* siehe oben */ }
    if (useUiStore.getState().contextPanelOpen !== contextPanelOpen) {
      try { useUiStore.getState().toggleContextPanel(); } catch { /* siehe oben */ }
    }
  }, [query.data]);

  return { ...query, pending, save: mutation.mutateAsync };
}
