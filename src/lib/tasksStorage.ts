import { demoTasks, type Task } from "@/demo/tasks";

const STORAGE_KEY = "corva.tasks";

/**
 * Aufgaben liegen bis zum Server-Abschnitt im lokalen Speicher. Lesen und
 * Schreiben sind hier gekapselt, damit der Tausch gegen echte Endpunkte
 * später nur diese Datei und den Hook betrifft.
 */
export function readTasks(storage: Storage): Task[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return demoTasks.map((task) => ({ ...task }));

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Gespeicherte Aufgaben sind beschädigt.");
  return parsed.filter(isTask);
}

export function writeTasks(tasks: Task[], storage: Storage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Prüft die Felder einzeln: ältere oder von Hand veränderte Einträge sollen
 * die Liste nicht zum Absturz bringen, sondern still übersprungen werden.
 */
function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.dueDate === "string" &&
    typeof task.done === "boolean" &&
    (task.priority === "hoch" || task.priority === "mittel" || task.priority === "niedrig")
  );
}
