import { describe, expect, it } from "vitest";
import { demoTasks } from "@/demo/tasks";
import { readTasks, writeTasks } from "./tasksStorage";

function memoryStorage(initial?: Record<string, string>): Storage {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, String(value)),
  };
}

describe("Aufgaben-Speicher", () => {
  it("liefert den Beispielbestand, solange nichts gespeichert ist", () => {
    expect(readTasks(memoryStorage())).toHaveLength(demoTasks.length);
  });

  it("schreibt und liest denselben Bestand zurück", () => {
    const storage = memoryStorage();
    const tasks = [{ ...demoTasks[0]!, title: "Geändert" }];

    writeTasks(tasks, storage);

    expect(readTasks(storage)).toEqual(tasks);
  });

  it("merkt sich auch eine leere Liste, statt zum Beispielbestand zurückzufallen", () => {
    const storage = memoryStorage();
    writeTasks([], storage);
    expect(readTasks(storage)).toEqual([]);
  });

  it("überspringt beschädigte Einträge, statt die Liste zu verlieren", () => {
    const storage = memoryStorage({
      "corva.tasks": JSON.stringify([demoTasks[0], { id: "kaputt" }, null, demoTasks[1]]),
    });

    expect(readTasks(storage).map((task) => task.id)).toEqual([demoTasks[0]!.id, demoTasks[1]!.id]);
  });

  it("meldet, wenn der gespeicherte Wert gar keine Liste ist", () => {
    const storage = memoryStorage({ "corva.tasks": JSON.stringify({ nope: true }) });
    expect(() => readTasks(storage)).toThrow();
  });
});
