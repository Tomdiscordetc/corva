import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AlertCircle, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { useContacts } from "@/hooks/useContacts";
import { useAuthStore } from "@/store/auth";
import {
  INSURANCE_BRANCHES,
  PIPELINE_STAGES,
  contactName,
  type Contact,
  type InsuranceBranch,
  type PipelineStage,
} from "@/demo/contacts";
import { DEFAULT_CONTACT_FILTER, type ContactSort } from "@/lib/contactFilters";
import { ContactTable } from "./ContactTable";
import { ContactCards } from "./ContactCards";
import { ContactDialog } from "./ContactDialog";
import { ContactPipeline } from "./ContactPipeline";
import { t } from "@/i18n";

type ViewMode = "table" | "cards" | "pipeline";
const SORTS: ContactSort[] = ["zuletzt", "name", "angelegt", "stufe"];

export function ContactsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const contacts = useContacts();
  const [view, setView] = useState<ViewMode>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const assignees = contacts.assignees.length > 0 ? contacts.assignees : [user?.name ?? "Team"];
  const defaultAssignee = assignees.includes(user?.name ?? "") ? user!.name : assignees[0]!;
  const filterActive =
    contacts.filter.query.trim() !== "" ||
    contacts.filter.stage !== "alle" ||
    contacts.filter.branch !== "alle" ||
    contacts.filter.assignee !== "alle";

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setDialogOpen(true);
  }

  function handleDelete(contact: Contact) {
    const removed = contacts.remove(contact.id);
    if (!removed) return;
    toast(t("contacts.toast.deleted"), {
      description: contactName(contact),
      action: {
        label: t("contacts.toast.undo"),
        onClick: () => {
          contacts.restore(removed.contact, removed.index, removed.activities);
          toast(t("contacts.toast.restored"));
        },
      },
    });
  }

  function handleMove(contact: Contact, stage: PipelineStage) {
    if (contact.stage === stage) return;
    contacts.moveToStage(contact.id, stage);
    toast(t("contacts.toast.moved", { stage: t(`contacts.stage.${stage}`) }), {
      description: contactName(contact),
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{t("contacts.title")}</h1>
          <p className="text-sm text-text-muted">{t("contacts.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {contacts.hasOnlyDemo && <StatusPill tone="neutral">{t("contacts.demoNotice")}</StatusPill>}
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("contacts.new")}
          </Button>
        </div>
      </div>

      {contacts.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/15 bg-danger-tint px-3 py-2.5 text-xs text-danger"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {contacts.error}
        </p>
      )}

      {/* Stufen als Schnellfilter mit Zähler — der Trichter auf einen Blick. */}
      <div className="flex flex-wrap items-center gap-2">
        <StageChip
          active={contacts.filter.stage === "alle"}
          label={t("contacts.stage.alle")}
          count={contacts.contacts.length}
          onClick={() => contacts.setFilter({ ...contacts.filter, stage: "alle" })}
        />
        {PIPELINE_STAGES.map((stage) => (
          <StageChip
            key={stage}
            active={contacts.filter.stage === stage}
            label={t(`contacts.stage.${stage}`)}
            count={contacts.stageCounts[stage]}
            onClick={() => contacts.setFilter({ ...contacts.filter, stage })}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input
          label={t("contacts.search")}
          hideLabel
          type="search"
          placeholder={t("contacts.search")}
          value={contacts.filter.query}
          onChange={(event) => contacts.setFilter({ ...contacts.filter, query: event.target.value })}
          trailing={<Search className="size-4" />}
        />
        <Select
          label={t("contacts.branch.label")}
          hideLabel
          value={contacts.filter.branch}
          onChange={(event) =>
            contacts.setFilter({ ...contacts.filter, branch: event.target.value as InsuranceBranch | "alle" })
          }
          options={[
            { value: "alle", label: t("contacts.branch.alle") },
            ...INSURANCE_BRANCHES.map((branch) => ({ value: branch, label: t(`contacts.branch.${branch}`) })),
          ]}
        />
        <Select
          label={t("contacts.assignee.label")}
          hideLabel
          value={contacts.filter.assignee}
          onChange={(event) => contacts.setFilter({ ...contacts.filter, assignee: event.target.value })}
          options={[
            { value: "alle", label: t("contacts.assignee.alle") },
            ...assignees.map((name) => ({ value: name, label: name })),
          ]}
        />
        <Select
          label={t("contacts.sort.label")}
          hideLabel
          value={contacts.filter.sort}
          onChange={(event) => contacts.setFilter({ ...contacts.filter, sort: event.target.value as ContactSort })}
          options={SORTS.map((sort) => ({ value: sort, label: t(`contacts.sort.${sort}`) }))}
        />
        <SegmentedControl
          aria-label={t("contacts.view.label")}
          value={view}
          onChange={(value: ViewMode) => setView(value)}
          options={[
            { value: "table", label: t("contacts.view.table") },
            { value: "cards", label: t("contacts.view.cards") },
            { value: "pipeline", label: t("contacts.view.pipeline") },
          ]}
        />
      </div>

      <p className="text-2xs text-text-faint">
        {t("contacts.count", { count: contacts.visible.length, total: contacts.contacts.length })}
      </p>

      {view === "pipeline" ? (
        <ContactPipeline
          contacts={contacts.visible}
          onMove={handleMove}
          onOpen={(contact) => navigate(`/app/contacts/${contact.id}`)}
        />
      ) : contacts.visible.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={filterActive ? t("contacts.empty.filtered") : t("contacts.empty.all")}
          action={
            filterActive ? (
              <Button variant="secondary" size="sm" onClick={() => contacts.setFilter(DEFAULT_CONTACT_FILTER)}>
                {t("contacts.empty.reset")}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                {t("contacts.empty.action")}
              </Button>
            )
          }
        />
      ) : view === "table" ? (
        <ContactTable
          contacts={contacts.visible}
          onOpen={(contact) => navigate(`/app/contacts/${contact.id}`)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      ) : (
        <AnimatePresence initial={false}>
          <ContactCards
            contacts={contacts.visible}
            onOpen={(contact) => navigate(`/app/contacts/${contact.id}`)}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </AnimatePresence>
      )}

      <p className="text-2xs text-text-faint">{t("contacts.localHint")}</p>

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editing}
        defaultAssignee={defaultAssignee}
        assignees={assignees}
        onSubmit={(draft) => {
          if (editing) {
            contacts.update(editing.id, draft);
            toast(t("contacts.toast.updated"), { description: `${draft.firstName} ${draft.lastName}`.trim() });
          } else {
            contacts.add(draft);
            toast(t("contacts.toast.created"), { description: `${draft.firstName} ${draft.lastName}`.trim() });
          }
        }}
      />
    </div>
  );
}

function StageChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-invert px-3 py-1.5 text-xs font-medium text-on-invert"
          : "rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text"
      }
    >
      {label}
      <span className={active ? "ml-1.5 opacity-70" : "ml-1.5 text-text-faint"}>{count}</span>
    </button>
  );
}
