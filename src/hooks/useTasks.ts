import { useCallback, useMemo, useRef, useState } from "react";
import { createTaskId, type Task } from "@/demo/tasks";
import { readTasks, writeTasks } from "@/lib/tasksStorage";
import { removeTask, restoreTask, toggleTask, upsertTask } from "@/lib/taskMutations";
import {
  countTasks,
  filterTasks,
  DEFAULT_TASK_FILTER,
  type TaskFilter,
} from "@/lib/taskFilters";

export type TaskDraft = Omit<Task, "id" | "createdAt" | "demo">;

/**
 * Aufgabenverwaltung auf dem lokalen Speicher. Änderungen erscheinen sofort
 * in der Liste und werden danach geschrieben; scheitert das Schreiben (etwa
 * im privaten Fenster), wird der vorherige Stand wiederhergestellt und ein
 * Fehler gemeldet.
 */
export function useTasks(storage: Storage = window.localStorage) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      return readTasks(storage);
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState<TaskFilter>(DEFAULT_TASK_FILTER);
  const [error, setError] = useState<string | null>(null);

  /*
    Zwei Aktionen im selben Render-Zyklus (schnell hintereinander abhaken,
    Löschen und sofort Rückgängig) würden sonst beide auf dem Stand des
    letzten Renders rechnen — die zweite Änderung ginge verloren oder legte
    einen Eintrag doppelt an. Deshalb ist diese Referenz die Quelle für
    Änderungen, nicht der Render-Wert.
  */
  const currentRef = useRef(tasks);

  const commit = useCallback(
    (mutate: (current: Task[]) => Task[]) => {
      const previous = currentRef.current;
      const next = mutate(previous);
      currentRef.current = next;
      setTasks(next);

      try {
        writeTasks(next, storage);
        setError(null);
        return true;
      } catch {
        currentRef.current = previous;
        setTasks(previous);
        setError("Die Änderung konnte nicht gespeichert werden.");
        return false;
      }
    },
    [storage],
  );

  const add = useCallback(
    (draft: TaskDraft) => {
      const task: Task = { ...draft, id: createTaskId(), createdAt: new Date().toISOString() };
      commit((current) => [task, ...current]);
      return task;
    },
    [commit],
  );

  const update = useCallback(
    (id: string, patch: Partial<TaskDraft>) => commit((current) => upsertTask(current, id, patch)),
    [commit],
  );

  const toggle = useCallback(
    (id: string) => commit((current) => toggleTask(current, id)),
    [commit],
  );

  /** Gibt die gelöschte Aufgabe samt Position zurück, damit sie zurückgeholt werden kann. */
  const remove = useCallback(
    (id: string) => {
      const result = removeTask(currentRef.current, id);
      if (!result) return null;
      commit(() => result.next);
      return { task: result.task, index: result.index };
    },
    [commit],
  );

  const restore = useCallback(
    (task: Task, index: number) => commit((current) => restoreTask(current, task, index)),
    [commit],
  );

  const visible = useMemo(() => filterTasks(tasks, filter), [filter, tasks]);
  const counts = useMemo(() => countTasks(tasks), [tasks]);
  const hasOnlyDemo = tasks.length > 0 && tasks.every((task) => task.demo);

  return {
    tasks,
    visible,
    counts,
    filter,
    setFilter,
    error,
    dismissError: () => setError(null),
    hasOnlyDemo,
    add,
    update,
    toggle,
    remove,
    restore,
  };
}
