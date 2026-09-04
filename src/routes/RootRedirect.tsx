import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

/** Entscheidet beim Aufruf von "/": Kaltstart zeigt den Splash, sonst direkt weiter. */
export function RootRedirect() {
  const status = useAuthStore((s) => s.status);
  const seenSplash = sessionStorage.getItem("corva.splash-seen") === "1";

  if (!seenSplash) {
    return <Navigate to="/splash" replace />;
  }
  return <Navigate to={status === "signed-in" ? "/app" : "/login"} replace />;
}
