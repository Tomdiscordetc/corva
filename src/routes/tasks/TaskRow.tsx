import { useState, type MouseEvent } from "react";
import { CalendarClock, MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Checkbox } from "@/components/ui/Checkbox";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { isOverdue, isDueToday } from "@/lib/taskFilters";
import { cn } from "@/lib/cn";
import type { Task, TaskPriority } from "@/demo/tasks";
import { t } from "@/i18n";

const PRIORITY_TONE: Record<TaskPriority, "danger" | "warning" | "neutral"> = {
  hoch: "danger",
  mittel: "warning",
  niedrig: "neutral",
};

const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

function formatDue(task: Task) {
  if (!task.dueDate) return t("tasks.row.noDueDate");
  const date = dateFormat.format(new Date(`${task.dueDate}T00:00:00`));
  return task.dueTime ? `${date}, ${task.dueTime} Uhr` : date;
}

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskRow({ task, onToggle, onEdit, onDelete }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const reduceMotion = useReducedMotion();
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);

  /* Rechtsklick öffnet dasselbe Menü wie die Schaltfläche. */
  function openMenu(event: MouseEvent) {
    event.preventDefault();
    setMenuOpen(true);
  }

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      onContextMenu={openMenu}
      className="relative overflow-hidden rounded-md border border-line bg-surface"
    >
      {/* Auf dem Handy nach links ziehen löscht — der rote Grund erscheint dabei. */}
      {/* Erst beim Ziehen sichtbar, sonst blitzt sie an der Kante durch. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 bg-danger px-5 text-sm font-medium text-neutral-0",
          "transition-opacity duration-[var(--t-fast)]",
          swiping ? "opacity-100" : "opacity-0",
        )}
      >
        <Trash2 className="size-4" />
        {t("tasks.row.delete")}
      </div>

      <motion.div
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        dragSnapToOrigin
        onDragStart={() => setSwiping(true)}
        onDragEnd={(_, info) => {
          setSwiping(false);
          if (info.offset.x < -120) onDelete();
        }}
        className={cn(
          "relative flex items-start gap-3 bg-surface px-4 py-3.5 transition-colors duration-[var(--t-fast)]",
          "hover:bg-surface-subtle lg:cursor-default",
          task.done && "bg-surface-subtle",
        )}
      >
        <Checkbox
          checked={task.done}
          onCheckedChange={onToggle}
          aria-label={task.done ? t("tasks.row.toggleOpen") : t("tasks.row.toggleDone")}
          className="mt-0.5"
        />

        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left"
        >
          <p className={cn("truncate text-sm font-medium text-text", task.done && "text-text-muted line-through")}>
            {task.title}
          </p>
          {task.notes && <p className="mt-0.5 truncate text-xs text-text-muted">{task.notes}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-text-faint">
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-danger")}>
              <CalendarClock className="size-3" />
              {formatDue(task)}
            </span>
            {task.contactName && (
              <span className="inline-flex items-center gap-1">
                <User className="size-3" />
                {task.contactName}
              </span>
            )}
            <span className="truncate">{task.assignee}</span>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {overdue && <StatusPill tone="danger">{t("tasks.row.overdue")}</StatusPill>}
          {!overdue && dueToday && <StatusPill tone="accent">{t("tasks.row.today")}</StatusPill>}
          <StatusPill tone={PRIORITY_TONE[task.priority]}>{t(`tasks.priority.${task.priority}`)}</StatusPill>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("tasks.row.actions")}
                className="flex size-8 items-center justify-center rounded-md text-text-faint transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="size-3.5" />
                {t("tasks.row.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggle}>
                {task.done ? t("tasks.row.toggleOpen") : t("tasks.row.toggleDone")}
              </DropdownMenuItem>
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 className="size-3.5" />
                {t("tasks.row.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </motion.li>
  );
}
