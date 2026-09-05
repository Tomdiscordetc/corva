import { describe, expect, it } from "vitest";
import type { Task } from "@/demo/tasks";
import { countTasks, filterTasks, isDueToday, isOverdue, DEFAULT_TASK_FILTER } from "./taskFilters";

const NOW = new Date("2026-09-05T10:00:00");

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: "Aufgabe",
    notes: "",
    dueDate: "2026-09-05",
    dueTime: "",
    priority: "mittel",
    done: false,
    contactName: "",
    assignee: "Sabine Krüger",
    createdAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

const bestand: Task[] = [
  task({ id: "heute", title: "Rückruf heute", dueDate: "2026-09-05", dueTime: "09:30", priority: "hoch" }),
  task({ id: "morgen", title: "Angebot senden", dueDate: "2026-09-06" }),
  task({ id: "gestern", title: "Wiedervorlage", dueDate: "2026-09-04", priority: "niedrig" }),
  task({ id: "fertig", title: "Erledigtes", dueDate: "2026-09-04", done: true }),
  task({ id: "offen-ohne", title: "Ohne Termin", dueDate: "", assignee: "Mehmet Aydın" }),
];

describe("Aufgaben-Filter", () => {
  it("erkennt überfällig und heute fällig", () => {
    expect(isOverdue(bestand[2]!, NOW)).toBe(true);
    expect(isDueToday(bestand[0]!, NOW)).toBe(true);
    // Erledigtes zählt weder als überfällig noch als heute offen.
    expect(isOverdue(bestand[3]!, NOW)).toBe(false);
    expect(isDueToday(bestand[3]!, NOW)).toBe(false);
  });

  it("zählt die Bereiche", () => {
    expect(countTasks(bestand, NOW)).toEqual({
      offen: 4,
      heute: 1,
      ueberfaellig: 1,
      erledigt: 1,
      alle: 5,
    });
  });

  it("zeigt im Bereich 'offen' kein Erledigtes", () => {
    const result = filterTasks(bestand, DEFAULT_TASK_FILTER, NOW);
    expect(result.map((t) => t.id)).not.toContain("fertig");
    expect(result).toHaveLength(4);
  });

  it("sortiert nach Fälligkeit, Aufgaben ohne Termin zuletzt", () => {
    const result = filterTasks(bestand, { ...DEFAULT_TASK_FILTER, scope: "alle" }, NOW);
    expect(result.map((t) => t.id)).toEqual(["gestern", "heute", "morgen", "offen-ohne", "fertig"]);
  });

  it("sortiert nach Priorität", () => {
    const result = filterTasks(bestand, { ...DEFAULT_TASK_FILTER, sort: "prioritaet" }, NOW);
    expect(result[0]!.id).toBe("heute");
    expect(result.at(-1)!.id).toBe("gestern");
  });

  it("sucht in Titel, Notiz und Kontakt", () => {
    const mitNotiz = [...bestand, task({ id: "notiz", title: "Sonstiges", notes: "Kfz-Police prüfen" })];
    expect(filterTasks(mitNotiz, { ...DEFAULT_TASK_FILTER, query: "kfz" }, NOW).map((t) => t.id)).toEqual(["notiz"]);
    expect(filterTasks(mitNotiz, { ...DEFAULT_TASK_FILTER, query: "rückruf" }, NOW).map((t) => t.id)).toEqual(["heute"]);
  });

  it("filtert nach Zuständigkeit", () => {
    const result = filterTasks(bestand, { ...DEFAULT_TASK_FILTER, assignee: "Mehmet Aydın" }, NOW);
    expect(result.map((t) => t.id)).toEqual(["offen-ohne"]);
  });
});
