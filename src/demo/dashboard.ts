/**
 * Demo-Daten für das Dashboard (REGELN.md Punkt 5: eine einzige Datei, in der
 * Oberfläche klar als Demo gekennzeichnet). Wird in Abschnitt 4 gegen echte
 * Endpunkte getauscht — Form der Daten bleibt dabei stabil.
 */

export type Channel = "email" | "telefon" | "whatsapp" | "instagram" | "meta" | "tiktok";

export interface KpiData {
  newLeads: number;
  newLeadsDelta: number | null;
  openConsultations: number;
  openConsultationsDelta: number | null;
  closedDeals: number;
  closedDealsDelta: number | null;
  conversionRate: number;
  conversionRateDelta: number | null;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface PipelineStage {
  key: "new" | "contacted" | "consultation" | "offer" | "won";
  count: number;
}

export interface TaskItem {
  id: string;
  title: string;
  time: string;
  contactName: string;
  done: boolean;
}

export interface ActivityItem {
  id: string;
  channel: Channel;
  contactName: string;
  description: string;
  timestamp: string;
}

export interface DashboardData {
  team: string;
  kpi: KpiData;
  trend: TrendPoint[];
  pipeline: PipelineStage[];
  tasks: TaskItem[];
  activity: ActivityItem[];
}

const trend: TrendPoint[] = [4, 6, 3, 7, 9, 5, 8, 10, 6, 9, 12, 8, 11, 14].map((count, i) => ({
  date: new Date(Date.now() - (13 - i) * 86_400_000).toISOString(),
  count,
}));

export const dashboardDemoData: DashboardData = {
  team: "Team Nord",
  kpi: {
    newLeads: 37,
    newLeadsDelta: 0.18,
    openConsultations: 14,
    openConsultationsDelta: -0.05,
    closedDeals: 9,
    closedDealsDelta: 0.32,
    conversionRate: 0.24,
    conversionRateDelta: 0.02,
  },
  trend,
  pipeline: [
    { key: "new", count: 18 },
    { key: "contacted", count: 11 },
    { key: "consultation", count: 7 },
    { key: "offer", count: 4 },
    { key: "won", count: 9 },
  ],
  tasks: [
    { id: "t1", title: "Rückruf: Kfz-Anfrage", time: "09:30", contactName: "Sabine Krüger", done: false },
    { id: "t2", title: "Beratungstermin vorbereiten", time: "11:00", contactName: "Mehmet Aydın", done: false },
    { id: "t3", title: "Angebot nachfassen", time: "14:15", contactName: "Julia Bergmann", done: true },
    { id: "t4", title: "Wiedervorlage: Berufsunfähigkeit", time: "16:00", contactName: "Thomas Nowak", done: false },
  ],
  activity: [
    { id: "a1", channel: "instagram", contactName: "Laura Fischer", description: "Neue Anfrage über Story-Kampagne", timestamp: new Date(Date.now() - 25 * 60_000).toISOString() },
    { id: "a2", channel: "whatsapp", contactName: "Kevin Brandt", description: "Rückfrage zur Hausratversicherung", timestamp: new Date(Date.now() - 90 * 60_000).toISOString() },
    { id: "a3", channel: "email", contactName: "Sandra Voigt", description: "Unterlagen für Angebot zugesandt", timestamp: new Date(Date.now() - 3 * 3_600_000).toISOString() },
    { id: "a4", channel: "telefon", contactName: "Michael Reuter", description: "Beratungsgespräch geführt (18 Min.)", timestamp: new Date(Date.now() - 5 * 3_600_000).toISOString() },
  ],
};

export type DashboardScenario = "ok" | "empty" | "error";

const emptyDashboardData: DashboardData = {
  team: dashboardDemoData.team,
  kpi: { newLeads: 0, newLeadsDelta: null, openConsultations: 0, openConsultationsDelta: null, closedDeals: 0, closedDealsDelta: null, conversionRate: 0, conversionRateDelta: null },
  trend: trend.map((p) => ({ ...p, count: 0 })),
  pipeline: dashboardDemoData.pipeline.map((s) => ({ ...s, count: 0 })),
  tasks: [],
  activity: [],
};

/**
 * Simulierter Abruf mit künstlicher Verzögerung, damit Lade- und Fehlerzustände
 * geprüft werden können. Szenario per `?scenario=empty|error` in der URL.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const scenario = (new URLSearchParams(location.search).get("scenario") as DashboardScenario | null) ?? "ok";
  await new Promise((r) => setTimeout(r, 700));
  if (scenario === "error") {
    throw new Error("Verbindung zum Server fehlgeschlagen.");
  }
  if (scenario === "empty") {
    return emptyDashboardData;
  }
  return dashboardDemoData;
}
