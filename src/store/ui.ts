import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Density = "comfortable" | "compact";

interface UiState {
  density: Density;
  setDensity: (density: Density) => void;
  contextPanelOpen: boolean;
  toggleContextPanel: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  shortcutsHelpOpen: boolean;
  setShortcutsHelpOpen: (open: boolean) => void;
}

/** Oberflächen-Zustand, der pro Person auf diesem Gerät erhalten bleibt. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      density: "comfortable",
      setDensity: (density) => set({ density }),
      contextPanelOpen: true,
      toggleContextPanel: () => set((s) => ({ contextPanelOpen: !s.contextPanelOpen })),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      shortcutsHelpOpen: false,
      setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),
    }),
    { name: "corva.ui" },
  ),
);
