import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  INSURANCE_BRANCHES,
  PIPELINE_STAGES,
  type Contact,
  type InsuranceBranch,
  type PipelineStage,
} from "@/demo/contacts";
import type { Channel } from "@/demo/dashboard";
import type { ContactDraft } from "@/hooks/useContacts";
import { t } from "@/i18n";

const SOURCES: Channel[] = ["email", "telefon", "whatsapp", "instagram", "meta", "tiktok"];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  city: string;
  stage: PipelineStage;
  branches: InsuranceBranch[];
  assignee: string;
  source: Channel;
  notes: string;
}

type FieldErrors = Partial<Record<"lastName" | "email" | "phone" | "contactWay" | "branches", string>>;

function emptyForm(assignee: string): FormState {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    city: "",
    stage: "neu",
    branches: [],
    assignee,
    source: "email",
    notes: "",
  };
}

/** Prüft die Eingaben; läuft beim Tippen und beim Absenden. */
export function validateContactForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.lastName.trim()) errors.lastName = t("contacts.validation.lastNameRequired");

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = t("contacts.validation.emailInvalid");
  }
  if (form.phone.trim() && !/^[+\d][\d\s/-]{4,}$/.test(form.phone.trim())) {
    errors.phone = t("contacts.validation.phoneInvalid");
  }
  // Ein Kontakt ohne Erreichbarkeit ist im Vertrieb wertlos.
  if (!form.email.trim() && !form.phone.trim() && !form.whatsapp.trim()) {
    errors.contactWay = t("contacts.validation.contactWayRequired");
  }
  if (form.branches.length === 0) errors.branches = t("contacts.validation.branchRequired");

  return errors;
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSubmit: (draft: ContactDraft) => void;
  defaultAssignee: string;
  assignees: string[];
}

export function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSubmit,
  defaultAssignee,
  assignees,
}: ContactDialogProps) {
  const isEdit = !!contact;
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultAssignee));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      contact
        ? {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            whatsapp: contact.whatsapp,
            instagram: contact.instagram,
            city: contact.city,
            stage: contact.stage,
            branches: [...contact.branches],
            assignee: contact.assignee,
            source: contact.source,
            notes: contact.notes,
          }
        : emptyForm(defaultAssignee),
    );
    setTouched({});
    setSubmitted(false);
  }, [contact, defaultAssignee, open]);

  const errors = validateContactForm(form);
  const showError = (field: keyof FieldErrors) => (submitted || touched[field] ? errors[field] : undefined);

  function change<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleBranch(branch: InsuranceBranch, checked: boolean) {
    setTouched((state) => ({ ...state, branches: true }));
    setForm((current) => ({
      ...current,
      branches: checked
        ? [...current.branches, branch]
        : current.branches.filter((entry) => entry !== branch),
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      instagram: form.instagram.trim(),
      city: form.city.trim(),
      stage: form.stage,
      branches: form.branches,
      assignee: form.assignee,
      source: form.source,
      notes: form.notes.trim(),
      lastContactAt: contact?.lastContactAt ?? "",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? t("contacts.dialog.editTitle") : t("contacts.dialog.createTitle")}
        description={isEdit ? t("contacts.dialog.editDescription") : t("contacts.dialog.createDescription")}
        className="w-[min(620px,calc(100vw-2rem))]"
      >
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("contacts.field.firstName")}
              value={form.firstName}
              onChange={(event) => change("firstName", event.target.value)}
              autoFocus
            />
            <Input
              label={t("contacts.field.lastName")}
              value={form.lastName}
              onChange={(event) => change("lastName", event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, lastName: true }))}
              error={showError("lastName")}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("contacts.field.email")}
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(event) => change("email", event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, email: true, contactWay: true }))}
              error={showError("email")}
            />
            <Input
              label={t("contacts.field.phone")}
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => change("phone", event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, phone: true, contactWay: true }))}
              error={showError("phone")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("contacts.field.whatsapp")}
              type="tel"
              value={form.whatsapp}
              onChange={(event) => change("whatsapp", event.target.value)}
              onBlur={() => setTouched((state) => ({ ...state, contactWay: true }))}
            />
            <Input
              label={t("contacts.field.instagram")}
              value={form.instagram}
              onChange={(event) => change("instagram", event.target.value)}
            />
          </div>

          {showError("contactWay") && (
            <p role="alert" className="text-xs text-danger">
              {errors.contactWay}
            </p>
          )}

          <Input
            label={t("contacts.field.city")}
            value={form.city}
            onChange={(event) => change("city", event.target.value)}
          />

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-text-muted">{t("contacts.branch.label")}</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {INSURANCE_BRANCHES.map((branch) => (
                <Checkbox
                  key={branch}
                  checked={form.branches.includes(branch)}
                  onCheckedChange={(checked) => toggleBranch(branch, checked)}
                  label={t(`contacts.branch.${branch}`)}
                />
              ))}
            </div>
            {showError("branches") && (
              <p role="alert" className="mt-2 text-xs text-danger">
                {errors.branches}
              </p>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label={t("contacts.stage.label")}
              value={form.stage}
              onChange={(event) => change("stage", event.target.value as PipelineStage)}
              options={PIPELINE_STAGES.map((stage) => ({ value: stage, label: t(`contacts.stage.${stage}`) }))}
            />
            <Select
              label={t("contacts.assignee.label")}
              value={form.assignee}
              onChange={(event) => change("assignee", event.target.value)}
              options={assignees.map((name) => ({ value: name, label: name }))}
            />
            <Select
              label={t("contacts.source.label")}
              value={form.source}
              onChange={(event) => change("source", event.target.value as Channel)}
              options={SOURCES.map((source) => ({ value: source, label: t(`contacts.source.${source}`) }))}
            />
          </div>

          <Input
            label={t("contacts.field.notes")}
            placeholder={t("contacts.field.notesPlaceholder")}
            value={form.notes}
            onChange={(event) => change("notes", event.target.value)}
          />

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{isEdit ? t("contacts.dialog.save") : t("contacts.dialog.create")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
