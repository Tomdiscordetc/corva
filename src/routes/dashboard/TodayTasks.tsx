import { useState } from "react";
import { ListTodo } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TaskItem } from "@/demo/dashboard";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";

export function TodayTasks({ tasks }: { tasks: TaskItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, task.done])),
  );

  if (tasks.length === 0) {
    return <EmptyState icon={<ListTodo className="size-5" />} title={t("dashboard.tasks.empty")} />;
  }

  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors duration-[var(--t-fast)] hover:bg-surface-subtle"
        >
          <Checkbox
            id={`task-${task.id}`}
            checked={done[task.id] ?? false}
            onCheckedChange={(checked) => setDone((prev) => ({ ...prev, [task.id]: checked }))}
          />
          <label htmlFor={`task-${task.id}`} className="min-w-0 flex-1 cursor-pointer">
            <p className={cn("truncate text-sm text-text", done[task.id] && "text-text-faint line-through")}>
              {task.title}
            </p>
            <p className="truncate text-2xs text-text-faint">{task.contactName}</p>
          </label>
          <span className="shrink-0 text-2xs tabular-nums text-text-faint">{task.time}</span>
        </li>
      ))}
    </ul>
  );
}
