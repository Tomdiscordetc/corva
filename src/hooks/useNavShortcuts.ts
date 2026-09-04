import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUiStore } from "@/store/ui";
import { markNavDirection } from "@/lib/navDirection";

/** "g" dann Buchstabe = springen. Reihenfolge/Ziele siehe ShortcutsHelpDialog. */
const GO_MAP: Record<string, string> = {
  d: "/app",
  c: "/app/contacts",
  i: "/app/inbox",
  k: "/app/calendar",
  a: "/app/tasks",
  r: "/app/reports",
  e: "/app/settings",
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Globale Navigations-Tastenkürzel: "g" + Buchstabe zum Springen, "?" öffnet
 * die Kurzübersicht. Deaktiviert sich automatisch in Eingabefeldern.
 */
export function useNavShortcuts() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const setShortcutsHelpOpen = useUiStore((s) => s.setShortcutsHelpOpen);
  const pendingRef = useRef(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (pendingRef.current) {
        pendingRef.current = false;
        window.clearTimeout(timeoutRef.current);
        const target = GO_MAP[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          markNavDirection(pathname, target);
          navigate(target, { viewTransition: true });
        }
        return;
      }

      if (e.key === "g") {
        pendingRef.current = true;
        timeoutRef.current = window.setTimeout(() => {
          pendingRef.current = false;
        }, 900);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsHelpOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timeoutRef.current);
    };
  }, [navigate, pathname, setShortcutsHelpOpen]);
}
