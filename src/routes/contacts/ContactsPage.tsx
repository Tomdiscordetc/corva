import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AlertCircle, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { useContacts } from "@/hooks/useContacts";
import { SERVER_MODE, useAuthStore } from "@/store/auth";
import { PIPELINE_STAGES, contactName, type Contact, type PipelineStage } from "@/demo/contacts";
import { DEFAULT_CONTACT_FILTER } from "@/lib/contactFilters";
import { ContactTable } from "./ContactTable";
import { ContactCards } from "./ContactCards";
import { ContactDialog } from "./ContactDialog";
import { ContactPipeline } from "./ContactPipeline";
import { ContactToolbar, type ContactView } from "./ContactToolbar";
import { StageDot } from "./ContactBits";
import { t } from "@/i18n";

export function ContactsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const contacts = useContacts();
  const [view, setView] = useState<ContactView>("table");
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

      {/* Stufen als Schnellfilter — der Trichter auf einen Blick. */}
      <div className="flex flex-wrap items-center gap-1">
        <StageChip
          active={contacts.filter.stage === "alle"}
          label={t("contacts.stage.alle")}
          count={contacts.contacts.length}
          onClick={() => contacts.setFilter({ ...contacts.filter, stage: "alle" })}
        />
        {PIPELINE_STAGES.map((stage) => (
          <StageChip
            key={stage}
            stage={stage}
            active={contacts.filter.stage === stage}
            label={t(`contacts.stage.${stage}`)}
            count={contacts.stageCounts[stage]}
            onClick={() => contacts.setFilter({ ...contacts.filter, stage })}
          />
        ))}
      </div>

      <ContactToolbar
        filter={contacts.filter}
        onFilterChange={contacts.setFilter}
        assignees={assignees}
        view={view}
        onViewChange={setView}
        shown={contacts.visible.length}
        total={contacts.contacts.length}
      />

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

      <p className="text-2xs text-text-faint">{t(SERVER_MODE ? "contacts.serverHint" : "contacts.localHint")}</p>

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
  stage,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  stage?: PipelineStage;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-md bg-invert px-2.5 py-1.5 text-xs font-medium text-on-invert"
          : "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text"
      }
    >
      {stage && <StageDot stage={stage} className={active ? "opacity-90" : undefined} />}
      {label}
      <span className={active ? "tabular-nums opacity-70" : "tabular-nums text-text-faint"}>{count}</span>
    </button>
  );
}
