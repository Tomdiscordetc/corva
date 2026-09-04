import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchDashboardData } from "@/demo/dashboard";

/**
 * Datenschicht des Dashboards. Komponenten kennen nur diesen Hook, nie die
 * Quelle dahinter (REGELN.md Punkt 8) — der Tausch gegen einen echten
 * Endpunkt in Abschnitt 4 bleibt dadurch auf diese Datei beschränkt.
 *
 * `?scenario=empty|error` steuert die Demo-Antwort — damit lassen sich Lade-,
 * Leer- und Fehlerzustände jederzeit ohne echten Server vorführen und prüfen.
 */
export function useDashboardData() {
  const [searchParams] = useSearchParams();
  const scenario = searchParams.get("scenario") ?? "ok";

  return useQuery({
    queryKey: ["dashboard", scenario],
    queryFn: fetchDashboardData,
    staleTime: 30_000,
  });
}
