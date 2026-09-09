import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TASK_PRIORITIES, type Task, type TaskPriority } from "@/demo/tasks";
import type { TaskDraft } from "@/hooks/useTasks";
import { t } from "@/i18n";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vorhandene Aufgabe = Bearbeiten, sonst Anlegen. */
  task?: Task | null;
  onSubmit: (draft: TaskDraft) => void;
  defaultAssignee: string;
  /** Wer im Team zur Auswahl steht — im Server-Modus die echten Konten. */
  assignees: string[];
}

interface FormState {
  title: string;
  notes: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  contactName: string;
  assignee: string;
}

type FieldErrors = Partial<Record<"title" | "dueDate" | "dueTime", string>>;

function emptyForm(assignee: string): FormState {
  return {
    title: "",
    notes: "",
    dueDate: "",
    dueTime: "",
    priority: "mittel",
    contactName: "",
    assignee,
  };
}

/** Prüft die Eingaben; wird beim Tippen und beim Absenden verwendet. */
export function validateTaskForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  const title = form.title.trim();

  if (!title) errors.title = t("tasks.validation.titleRequired");
  else if (title.length > 120) errors.title = t("tasks.validation.titleTooLong");

  if (form.dueDate && Number.isNaN(Date.parse(form.dueDate))) {
    errors.dueDate = t("tasks.validation.dateInvalid");
  }
  if (form.dueTime && !form.dueDate) {
    errors.dueTime = t("tasks.validation.timeNeedsDate");
  }
  return errors;
}

export function TaskDialog({ open, onOpenChange, task, onSubmit, defaultAssignee, assignees }: TaskDialogProps) {
  const isEdit = !!task;
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultAssignee));
  /** Erst nach der ersten Berührung meckern, nicht schon beim Öffnen. */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            title: task.title,
            notes: task.notes,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            priority: task.priority,
            contactName: task.contactName,
            assignee: task.assignee,
          }
        : emptyForm(defaultAssignee),
    );
    setTouched({});
    setSubmitted(false);
  }, [defaultAssignee, open, task]);

  const errors = validateTaskForm(form);
  const showError = (field: keyof FieldErrors) => (submitted || touched[field] ? errors[field] : undefined);

  function change<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      title: form.title.trim(),
      notes: form.notes.trim(),
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      priority: form.priority,
      contactName: form.contactName.trim(),
      assignee: form.assignee,
      done: task?.done ?? false,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? t("tasks.dialog.editTitle") : t("tasks.dialog.createTitle")}
        description={isEdit ? t("tasks.dialog.editDescription") : t("tasks.dialog.createDescription")}
        className="w-[min(560px,calc(100vw-2rem))]"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label={t("tasks.field.title")}
            placeholder={t("tasks.field.titlePlaceholder")}
            value={form.title}
            onChange={(event) => change("title", event.target.value)}
            onBlur={() => setTouched((state) => ({ ...state, title: true }))}
            error={showError("title")}
            autoFocus
            required
          />

          <Input
            label={t("tasks.field.notes")}
            placeholder={t("tasks.field.notesPlaceholder")}
            value={form.notes}
            onChange={(event) => change("notes", event.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("tasks.field.dueDate")}
              type="date"
              value={form.dueDate}
              onChange={(event) => change("dueDate", event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, dueDate: true }))}
              error={showError("dueDate")}
            />
            <Input
              label={t("tasks.field.dueTime")}
              type="time"
              value={form.dueTime}
              onChange={(event) => change("dueTime", event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, dueTime: true }))}
              error={showError("dueTime")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("tasks.priority.label")}
              value={form.priority}
              onChange={(event) => change("priority", event.target.value as TaskPriority)}
              options={TASK_PRIORITIES.map((priority) => ({
                value: priority,
                label: t(`tasks.priority.${priority}`),
              }))}
            />
            <Select
              label={t("tasks.assignee.label")}
              value={form.assignee}
              onChange={(event) => change("assignee", event.target.value)}
              options={assignees.map((name) => ({ value: name, label: name }))}
            />
          </div>

          <Input
            label={t("tasks.field.contact")}
            placeholder={t("tasks.field.contactPlaceholder")}
            value={form.contactName}
            onChange={(event) => change("contactName", event.target.value)}
          />

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{isEdit ? t("tasks.dialog.save") : t("tasks.dialog.create")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
