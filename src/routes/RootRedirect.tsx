import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { ServerSession } from "@/components/system/ServerSession";

/** Entscheidet beim Aufruf von "/": Kaltstart zeigt den Splash, sonst direkt weiter. */
export function RootRedirect() {
  const status = useAuthStore((s) => s.status);
  const checked = useAuthStore((s) => s.checked);
  const seenSplash = sessionStorage.getItem("corva.splash-seen") === "1";

  if (!checked) return <ServerSession />;
  if (status === "signed-in") return <Navigate to="/app" replace />;
  if (!seenSplash) {
    return <Navigate to="/splash" replace />;
  }
  // Angemeldete sind oben schon abgebogen — hier bleibt nur die Anmeldung.
  return <Navigate to="/login" replace />;
}
