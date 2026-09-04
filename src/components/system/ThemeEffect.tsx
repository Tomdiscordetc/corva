import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

/** Hält `document.documentElement.dataset.theme` mit der gewählten Einstellung synchron. */
export function ThemeEffect() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    if (theme === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return null;
}
