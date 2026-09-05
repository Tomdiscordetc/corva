import { describe, expect, it } from "vitest";
import type { Task } from "@/demo/tasks";
import { removeTask, restoreTask, toggleTask, upsertTask } from "./taskMutations";

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Aufgabe ${id}`,
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

const bestand = [task("a"), task("b"), task("c")];

describe("Aufgaben-Änderungen", () => {
  it("ändert nur den getroffenen Eintrag", () => {
    const next = upsertTask(bestand, "b", { title: "Neu" });
    expect(next.map((t) => t.title)).toEqual(["Aufgabe a", "Neu", "Aufgabe c"]);
    expect(next[0]).toBe(bestand[0]);
  });

  it("dreht den Erledigt-Zustand um", () => {
    expect(toggleTask(bestand, "a")[0]!.done).toBe(true);
    expect(toggleTask(toggleTask(bestand, "a"), "a")[0]!.done).toBe(false);
  });

  it("löscht und merkt sich die Position", () => {
    const result = removeTask(bestand, "b");
    expect(result?.index).toBe(1);
    expect(result?.next.map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("meldet nichts, wenn die Aufgabe schon weg ist", () => {
    expect(removeTask(bestand, "gibtsnicht")).toBeNull();
  });

  it("setzt eine gelöschte Aufgabe an ihre alte Stelle zurück", () => {
    const removed = removeTask(bestand, "b")!;
    expect(restoreTask(removed.next, removed.task, removed.index).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("legt beim doppelten Wiederherstellen keinen zweiten Eintrag an", () => {
    const removed = removeTask(bestand, "b")!;
    const once = restoreTask(removed.next, removed.task, removed.index);
    const twice = restoreTask(once, removed.task, removed.index);

    expect(twice.map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(twice).toBe(once);
  });

  it("hängt eine Aufgabe hinten an, wenn die alte Position nicht mehr existiert", () => {
    const removed = removeTask(bestand, "c")!;
    const kleiner = removed.next.slice(0, 1);
    expect(restoreTask(kleiner, removed.task, removed.index).map((t) => t.id)).toEqual(["a", "c"]);
  });
});
