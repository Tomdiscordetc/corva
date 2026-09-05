import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { AlertCircle, ListTodo, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/auth";
import { TASK_ASSIGNEES, type Task } from "@/demo/tasks";
import type { TaskScope, TaskSort } from "@/lib/taskFilters";
import { TaskRow } from "./TaskRow";
import { TaskDialog } from "./TaskDialog";
import { t } from "@/i18n";

const SCOPES: TaskScope[] = ["offen", "heute", "ueberfaellig", "erledigt", "alle"];
const SORTS: TaskSort[] = ["faelligkeit", "prioritaet", "angelegt"];

export function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const tasks = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const defaultAssignee = TASK_ASSIGNEES.includes(user?.name as (typeof TASK_ASSIGNEES)[number])
    ? user!.name
    : TASK_ASSIGNEES[0];

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  function handleDelete(task: Task) {
    const removed = tasks.remove(task.id);
    if (!removed) return;
    toast(t("tasks.toast.deleted"), {
      description: task.title,
      action: {
        label: t("tasks.toast.undo"),
        onClick: () => {
          tasks.restore(removed.task, removed.index);
          toast(t("tasks.toast.restored"));
        },
      },
    });
  }

  function handleToggle(task: Task) {
    tasks.toggle(task.id);
    toast(task.done ? t("tasks.toast.reopened") : t("tasks.toast.done"), { description: task.title });
  }

  const emptyKey = tasks.filter.query.trim() ? "search" : tasks.filter.scope;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{t("tasks.title")}</h1>
          <p className="text-sm text-text-muted">{t("tasks.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {tasks.hasOnlyDemo && <StatusPill tone="neutral">{t("tasks.demoNotice")}</StatusPill>}
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("tasks.new")}
          </Button>
        </div>
      </div>

      {tasks.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/15 bg-danger-tint px-3 py-2.5 text-xs text-danger"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {tasks.error}
        </p>
      )}

      {/* Bereichsauswahl mit Zähler: zeigt auf einen Blick, wo etwas liegt. */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t("tasks.title")}>
        {SCOPES.map((scope) => {
          const active = tasks.filter.scope === scope;
          return (
            <button
              key={scope}
              role="tab"
              aria-selected={active}
              onClick={() => tasks.setFilter({ ...tasks.filter, scope })}
              className={
                active
                  ? "rounded-md bg-invert px-3 py-1.5 text-xs font-medium text-on-invert"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text"
              }
            >
              {t(`tasks.scope.${scope}`)}
              <span className={active ? "ml-1.5 opacity-70" : "ml-1.5 text-text-faint"}>
                {tasks.counts[scope]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          label={t("tasks.search")}
          hideLabel
          placeholder={t("tasks.search")}
          value={tasks.filter.query}
          onChange={(event) => tasks.setFilter({ ...tasks.filter, query: event.target.value })}
          trailing={<Search className="size-4" />}
          type="search"
        />
        <Select
          label={t("tasks.assignee.label")}
          hideLabel
          value={tasks.filter.assignee}
          onChange={(event) => tasks.setFilter({ ...tasks.filter, assignee: event.target.value })}
          options={[
            { value: "alle", label: t("tasks.assignee.alle") },
            ...TASK_ASSIGNEES.map((name) => ({ value: name, label: name })),
          ]}
        />
        <Select
          label={t("tasks.sort.label")}
          hideLabel
          value={tasks.filter.sort}
          onChange={(event) => tasks.setFilter({ ...tasks.filter, sort: event.target.value as TaskSort })}
          options={SORTS.map((sort) => ({ value: sort, label: t(`tasks.sort.${sort}`) }))}
        />
      </div>

      {tasks.visible.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="size-5" />}
          title={t(`tasks.empty.${emptyKey}`)}
          action={
            <Button variant="secondary" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              {t("tasks.empty.action")}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {tasks.visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onEdit={() => openEdit(task)}
                onDelete={() => handleDelete(task)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <p className="text-2xs text-text-faint">{t("tasks.localHint")}</p>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultAssignee={defaultAssignee}
        onSubmit={(draft) => {
          if (editing) {
            tasks.update(editing.id, draft);
            toast(t("tasks.toast.updated"), { description: draft.title });
          } else {
            tasks.add(draft);
            toast(t("tasks.toast.created"), { description: draft.title });
          }
        }}
      />
    </div>
  );
}
