import { useEffect } from "react";
import { useUiStore } from "@/store/ui";

/** Strg/Cmd+K öffnet die Befehlspalette von überall in der App-Shell aus. */
export function useCommandPaletteShortcut() {
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
}
