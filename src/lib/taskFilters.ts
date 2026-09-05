import type { Task, TaskPriority } from "@/demo/tasks";

export type TaskScope = "offen" | "heute" | "ueberfaellig" | "erledigt" | "alle";
export type TaskSort = "faelligkeit" | "prioritaet" | "angelegt";

export interface TaskFilter {
  scope: TaskScope;
  query: string;
  assignee: string | "alle";
  sort: TaskSort;
}

export const DEFAULT_TASK_FILTER: TaskFilter = {
  scope: "offen",
  query: "",
  assignee: "alle",
  sort: "faelligkeit",
};

const PRIORITY_ORDER: Record<TaskPriority, number> = { hoch: 0, mittel: 1, niedrig: 2 };

/** Heutiges Datum als YYYY-MM-DD in lokaler Zeit — nicht über toISOString(). */
export function today(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isOverdue(task: Task, now = new Date()) {
  return !task.done && !!task.dueDate && task.dueDate < today(now);
}

export function isDueToday(task: Task, now = new Date()) {
  return !task.done && task.dueDate === today(now);
}

export function countTasks(tasks: Task[], now = new Date()) {
  return {
    offen: tasks.filter((task) => !task.done).length,
    heute: tasks.filter((task) => isDueToday(task, now)).length,
    ueberfaellig: tasks.filter((task) => isOverdue(task, now)).length,
    erledigt: tasks.filter((task) => task.done).length,
    alle: tasks.length,
  };
}

function matchesScope(task: Task, scope: TaskScope, now: Date) {
  switch (scope) {
    case "offen":
      return !task.done;
    case "heute":
      return isDueToday(task, now);
    case "ueberfaellig":
      return isOverdue(task, now);
    case "erledigt":
      return task.done;
    case "alle":
      return true;
  }
}

/**
 * Filtert und sortiert den Bestand. Bewusst als reine Funktion, damit die
 * Regeln ohne Oberfläche prüfbar sind.
 */
export function filterTasks(tasks: Task[], filter: TaskFilter, now = new Date()): Task[] {
  const needle = filter.query.trim().toLowerCase();

  const filtered = tasks.filter((task) => {
    if (!matchesScope(task, filter.scope, now)) return false;
    if (filter.assignee !== "alle" && task.assignee !== filter.assignee) return false;
    if (!needle) return true;
    return (
      task.title.toLowerCase().includes(needle) ||
      task.notes.toLowerCase().includes(needle) ||
      task.contactName.toLowerCase().includes(needle)
    );
  });

  return [...filtered].sort((a, b) => {
    // Erledigtes rutscht in gemischten Ansichten immer nach unten.
    if (a.done !== b.done) return a.done ? 1 : -1;

    if (filter.sort === "prioritaet") {
      const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (byPriority !== 0) return byPriority;
      return compareDue(a, b);
    }
    if (filter.sort === "angelegt") {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return compareDue(a, b);
  });
}

/** Aufgaben ohne Termin hängen sich hinten an, sonst nach Datum und Uhrzeit. */
function compareDue(a: Task, b: Task) {
  if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title, "de");
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  const byDate = a.dueDate.localeCompare(b.dueDate);
  if (byDate !== 0) return byDate;
  if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
  if (a.dueTime) return -1;
  if (b.dueTime) return 1;
  return a.title.localeCompare(b.title, "de");
}
