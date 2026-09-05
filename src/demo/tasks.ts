/**
 * Aufgaben-Datenmodell und Startbestand. Solange kein Server dahinter steht,
 * liegen die Aufgaben im lokalen Speicher des Geräts (siehe lib/tasksStorage).
 * Der Startbestand ist in der Oberfläche als Demo gekennzeichnet
 * (REGELN.md Punkt 5) und verschwindet, sobald echte Aufgaben angelegt werden.
 */

export type TaskPriority = "hoch" | "mittel" | "niedrig";

export interface Task {
  id: string;
  title: string;
  notes: string;
  /** Fälligkeit als ISO-Datum (YYYY-MM-DD); leer = ohne Termin. */
  dueDate: string;
  /** Uhrzeit als HH:MM; leer = ganztägig. */
  dueTime: string;
  priority: TaskPriority;
  done: boolean;
  /** Verknüpfter Kontakt, leer wenn die Aufgabe für sich steht. */
  contactName: string;
  assignee: string;
  createdAt: string;
  /** Kennzeichnet den mitgelieferten Beispielbestand. */
  demo?: boolean;
}

export const TASK_PRIORITIES: TaskPriority[] = ["hoch", "mittel", "niedrig"];

/** Teammitglieder aus der Kontextspalte — später aus der Nutzerverwaltung. */
export const TASK_ASSIGNEES = [
  "Sabine Krüger",
  "Mehmet Aydın",
  "Julia Bergmann",
  "Thomas Nowak",
] as const;

function isoDay(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export const demoTasks: Task[] = [
  {
    id: "demo-1",
    title: "Rückruf: Kfz-Anfrage",
    notes: "Wechselangebot zum Jahresende durchrechnen.",
    dueDate: isoDay(0),
    dueTime: "09:30",
    priority: "hoch",
    done: false,
    contactName: "Sabine Krüger",
    assignee: "Sabine Krüger",
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    demo: true,
  },
  {
    id: "demo-2",
    title: "Beratungstermin vorbereiten",
    notes: "Unterlagen zur Berufsunfähigkeit zusammenstellen.",
    dueDate: isoDay(0),
    dueTime: "11:00",
    priority: "mittel",
    done: false,
    contactName: "Mehmet Aydın",
    assignee: "Mehmet Aydın",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    demo: true,
  },
  {
    id: "demo-3",
    title: "Angebot nachfassen",
    notes: "",
    dueDate: isoDay(0),
    dueTime: "14:15",
    priority: "mittel",
    done: true,
    contactName: "Julia Bergmann",
    assignee: "Julia Bergmann",
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    demo: true,
  },
  {
    id: "demo-4",
    title: "Wiedervorlage: Berufsunfähigkeit",
    notes: "Kunde wollte Rücksprache mit Partnerin halten.",
    dueDate: isoDay(-2),
    dueTime: "16:00",
    priority: "hoch",
    done: false,
    contactName: "Thomas Nowak",
    assignee: "Thomas Nowak",
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    demo: true,
  },
  {
    id: "demo-5",
    title: "Hausrat-Police prüfen",
    notes: "Deckungssumme an neue Wohnfläche anpassen.",
    dueDate: isoDay(3),
    dueTime: "",
    priority: "niedrig",
    done: false,
    contactName: "Kevin Brandt",
    assignee: "Sabine Krüger",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    demo: true,
  },
];

export function createTaskId() {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
