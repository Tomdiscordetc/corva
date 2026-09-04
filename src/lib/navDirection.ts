import { getNavItems } from "@/components/shell/navItems";

/**
 * Setzt die Richtung für den nächsten Seitenübergang auf <html>, bevor
 * navigiert wird. Die CSS-Regeln dafür stehen in theme.css. Reihenfolge
 * kommt aus getNavItems() — Wechsel zu einem späteren Punkt = vorwärts.
 */
export function markNavDirection(fromPath: string, toPath: string) {
  const items = getNavItems();
  const fromIndex = items.findIndex((i) => matches(i.path, fromPath));
  const toIndex = items.findIndex((i) => matches(i.path, toPath));

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    delete document.documentElement.dataset.navDirection;
    return;
  }
  document.documentElement.dataset.navDirection = toIndex > fromIndex ? "forward" : "backward";
}

function matches(itemPath: string, currentPath: string) {
  return itemPath === "/app" ? currentPath === "/app" : currentPath.startsWith(itemPath);
}
