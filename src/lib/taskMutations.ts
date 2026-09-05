import type { Task } from "@/demo/tasks";

/**
 * Reine Änderungsschritte auf dem Aufgabenbestand. Ausgelagert, damit sie
 * ohne Oberfläche prüfbar sind — und damit der Hook sie auf dem jeweils
 * aktuellen Stand anwenden kann statt auf dem des letzten Renders.
 */

export function upsertTask(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
}

export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
}

export function removeTask(tasks: Task[], id: string): { next: Task[]; task: Task; index: number } | null {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;
  return { next: tasks.filter((task) => task.id !== id), task: tasks[index]!, index };
}

/**
 * Setzt eine gelöschte Aufgabe an ihre alte Stelle zurück. Ist sie bereits
 * vorhanden — etwa weil zweimal auf „Rückgängig" geklickt wurde — bleibt der
 * Bestand unverändert, statt sie doppelt anzulegen.
 */
export function restoreTask(tasks: Task[], task: Task, index: number): Task[] {
  if (tasks.some((existing) => existing.id === task.id)) return tasks;
  const next = [...tasks];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, task);
  return next;
}
