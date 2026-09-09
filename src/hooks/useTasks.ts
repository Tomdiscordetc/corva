import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTaskId, type Task } from "@/demo/tasks";
import { api, ApiError, SERVER_MODE } from "@/lib/api";
import { readTasks, writeTasks } from "@/lib/tasksStorage";
import { removeTask, restoreTask, toggleTask, upsertTask } from "@/lib/taskMutations";
import {
  countTasks,
  filterTasks,
  DEFAULT_TASK_FILTER,
  type TaskFilter,
} from "@/lib/taskFilters";

export type TaskDraft = Omit<Task, "id" | "createdAt" | "demo">;

const FAILED = "Die Änderung konnte nicht gespeichert werden.";

interface TasksResponse {
  tasks: Task[];
  assignees: { id: string; name: string }[];
}

/**
 * Aufgabenverwaltung. Im Server-Modus liegen die Aufgaben beim Mandanten und
 * sind für das ganze Team sichtbar, im Demo-Modus nur auf diesem Gerät. Die
 * Oberfläche sieht in beiden Fällen dieselbe Schnittstelle.
 */
export function useTasks(storage: Storage = window.localStorage) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (SERVER_MODE) return [];
    try {
      return readTasks(storage);
    } catch {
      return [];
    }
  });
  const [serverAssignees, setServerAssignees] = useState<string[]>([]);
  const [loading, setLoading] = useState(SERVER_MODE);
  const [filter, setFilter] = useState<TaskFilter>(DEFAULT_TASK_FILTER);
  const [error, setError] = useState<string | null>(null);

  /*
    Zwei Aktionen im selben Render-Zyklus (schnell hintereinander abhaken,
    Löschen und sofort Rückgängig) würden sonst beide auf dem Stand des
    letzten Renders rechnen — die zweite Änderung ginge verloren oder legte
    einen Eintrag doppelt an.
  */
  const currentRef = useRef(tasks);

  const applyLocal = useCallback(
    (mutate: (current: Task[]) => Task[]) => {
      const previous = currentRef.current;
      const next = mutate(previous);
      currentRef.current = next;
      setTasks(next);

      if (SERVER_MODE) return true;
      try {
        writeTasks(next, storage);
        setError(null);
        return true;
      } catch {
        currentRef.current = previous;
        setTasks(previous);
        setError(FAILED);
        return false;
      }
    },
    [storage],
  );

  const load = useCallback(async () => {
    if (!SERVER_MODE) return;
    try {
      const data = await api<TasksResponse>("/tasks");
      currentRef.current = data.tasks;
      setTasks(data.tasks);
      setServerAssignees(data.assignees.map((entry) => entry.name));
      setError(null);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const call = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    try {
      const result = await action();
      setError(null);
      return result;
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : FAILED);
      void load();
      return null;
    }
  }, [load]);

  const add = useCallback(
    (draft: TaskDraft) => {
      if (SERVER_MODE) {
        void call(async () => {
          const { task } = await api<{ task: Task }>("/tasks", { method: "POST", body: draft });
          applyLocal((current) => [task, ...current]);
          return task;
        });
        return null;
      }
      const task: Task = { ...draft, id: createTaskId(), createdAt: new Date().toISOString() };
      applyLocal((current) => [task, ...current]);
      return task;
    },
    [applyLocal, call],
  );

  const update = useCallback(
    (id: string, patch: Partial<TaskDraft>) => {
      applyLocal((current) => upsertTask(current, id, patch));
      if (SERVER_MODE) {
        void call(async () => {
          const { task } = await api<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: patch });
          applyLocal((current) => upsertTask(current, id, task));
          return task;
        });
      }
    },
    [applyLocal, call],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = !currentRef.current.find((task) => task.id === id)?.done;
      applyLocal((current) => toggleTask(current, id));
      if (SERVER_MODE) {
        void call(() => api<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: { done: next } }));
      }
    },
    [applyLocal, call],
  );

  /** Gibt die gelöschte Aufgabe samt Position zurück, damit sie zurückgeholt werden kann. */
  const remove = useCallback(
    (id: string) => {
      const result = removeTask(currentRef.current, id);
      if (!result) return null;
      applyLocal(() => result.next);
      if (SERVER_MODE) {
        void call(() => api(`/tasks/${id}`, { method: "DELETE", body: {} }));
      }
      return { task: result.task, index: result.index };
    },
    [applyLocal, call],
  );

  const restore = useCallback(
    (task: Task, index: number) => {
      applyLocal((current) => restoreTask(current, task, index));
      if (SERVER_MODE) {
        // Der Server hat sie nur in den Papierkorb gelegt.
        void call(() => api<{ task: Task }>(`/tasks/${task.id}/restore`, { method: "POST", body: {} }));
      }
    },
    [applyLocal, call],
  );

  const visible = useMemo(() => filterTasks(tasks, filter), [filter, tasks]);
  const counts = useMemo(() => countTasks(tasks), [tasks]);
  const assignees = useMemo(() => {
    if (SERVER_MODE) return serverAssignees;
    return [...new Set(tasks.map((task) => task.assignee))].filter(Boolean).sort((a, b) => a.localeCompare(b, "de"));
  }, [serverAssignees, tasks]);
  const hasOnlyDemo = !SERVER_MODE && tasks.length > 0 && tasks.every((task) => task.demo);

  return {
    tasks,
    visible,
    counts,
    assignees,
    filter,
    setFilter,
    error,
    loading,
    dismissError: () => setError(null),
    hasOnlyDemo,
    reload: load,
    add,
    update,
    toggle,
    remove,
    restore,
  };
}
