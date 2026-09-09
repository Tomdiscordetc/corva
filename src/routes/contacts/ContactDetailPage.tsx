import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  CalendarClock,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useContacts } from "@/hooks/useContacts";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/auth";
import { contactName, PIPELINE_STAGES, type PipelineStage } from "@/demo/contacts";
import type { Channel } from "@/demo/dashboard";
import { BranchList, StagePill } from "./ContactBits";
import { ContactDialog } from "./ContactDialog";
import { t } from "@/i18n";

const LOG_CHANNELS: Channel[] = ["telefon", "email", "whatsapp", "instagram"];
const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ContactDetailPage() {
  const { contactId = "" } = useParams();
  const navigate = useNavigate();
  const contacts = useContacts();
  const tasks = useTasks();
  const user = useAuthStore((s) => s.user);
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Im Server-Modus liegt der Verlauf erst nach dem Nachladen vor.
  useEffect(() => {
    contacts.ensureHistory(contactId);
  }, [contactId, contacts]);

  const contact = contacts.byId(contactId);

  if (!contact) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title={t("contacts.detail.notFound")}
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/app/contacts")}>
              {t("contacts.detail.back")}
            </Button>
          }
        />
      </div>
    );
  }

  const name = contactName(contact);
  const history = contacts.historyOf(contact.id);
  // Aufgaben hängen bisher am Namen — mit dem Server wird daraus eine echte
  // Verknüpfung über die Kontakt-Kennung.
  const linkedTasks = tasks.tasks.filter((task) => task.contactName === name);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/app/contacts"
        className="group inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors duration-[var(--t-fast)] hover:text-text"
      >
        <ArrowLeft className="size-3.5 transition-transform duration-[var(--t-fast)] group-hover:-translate-x-0.5" />
        {t("contacts.detail.back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Avatar name={name} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-text">{name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StagePill stage={contact.stage} />
              <BranchList branches={contact.branches} max={4} />
            </div>
            <p className="mt-2 text-2xs text-text-faint">
              {t("contacts.detail.createdAt", { date: dateFormat.format(new Date(contact.createdAt)) })}
              {" · "}
              {t("contacts.detail.source", { channel: t(`contacts.source.${contact.source}`) })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            label={t("contacts.stage.label")}
            hideLabel
            value={contact.stage}
            onChange={(event) => {
              const stage = event.target.value as PipelineStage;
              contacts.moveToStage(contact.id, stage);
              toast(t("contacts.toast.moved", { stage: t(`contacts.stage.${stage}`) }), { description: name });
            }}
            options={PIPELINE_STAGES.map((stage) => ({ value: stage, label: t(`contacts.stage.${stage}`) }))}
          />
          <Button variant="secondary" onClick={() => setLogOpen(true)}>
            <Plus className="size-4" />
            {t("contacts.detail.logNote")}
          </Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            {t("contacts.row.edit")}
          </Button>
          <Button
            variant="ghost"
            aria-label={t("contacts.row.delete")}
            onClick={() => {
              const removed = contacts.remove(contact.id);
              navigate("/app/contacts");
              if (!removed) return;
              toast(t("contacts.toast.deleted"), {
                description: name,
                action: {
                  label: t("contacts.toast.undo"),
                  onClick: () => {
                    contacts.restore(removed.contact, removed.index, removed.activities);
                    toast(t("contacts.toast.restored"));
                  },
                },
              });
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.detail.channels")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!contact.email && !contact.phone && !contact.whatsapp && !contact.instagram && (
                <p className="text-sm text-text-muted">{t("contacts.detail.noChannel")}</p>
              )}
              {contact.email && (
                <ChannelRow icon={<Mail className="size-4" />} value={contact.email} href={`mailto:${contact.email}`} />
              )}
              {contact.phone && (
                <ChannelRow icon={<Phone className="size-4" />} value={contact.phone} href={`tel:${contact.phone.replace(/\s/g, "")}`} />
              )}
              {contact.whatsapp && (
                <ChannelRow
                  icon={<MessageCircle className="size-4" />}
                  value={contact.whatsapp}
                  href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                />
              )}
              {contact.instagram && <ChannelRow icon={<AtSign className="size-4" />} value={contact.instagram} />}
              {contact.city && <ChannelRow icon={<MapPin className="size-4" />} value={contact.city} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.detail.masterData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label={t("contacts.assignee.label")} value={contact.assignee} />
              <Row label={t("contacts.branch.label")} value={contact.branches.map((b) => t(`contacts.branch.${b}`)).join(", ") || "—"} />
              {contact.notes && <Row label={t("contacts.field.notes")} value={contact.notes} />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.detail.history")}</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">{t("contacts.detail.historyEmpty")}</p>
              ) : (
                <ol className="space-y-3">
                  {history.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted">
                        {entry.channel === "telefon" ? (
                          <Phone className="size-3.5" />
                        ) : entry.channel === "whatsapp" ? (
                          <MessageCircle className="size-3.5" />
                        ) : entry.channel === "instagram" ? (
                          <AtSign className="size-3.5" />
                        ) : (
                          <Mail className="size-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-text">{entry.description}</p>
                        <p className="text-2xs text-text-faint">
                          {t(`contacts.source.${entry.channel}`)} ·{" "}
                          {entry.direction === "eingehend"
                            ? t("contacts.detail.logIncoming")
                            : t("contacts.detail.logOutgoing")}{" "}
                          · {dateTimeFormat.format(new Date(entry.timestamp))} Uhr
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.detail.tasks")}</CardTitle>
            </CardHeader>
            <CardContent>
              {linkedTasks.length === 0 ? (
                <p className="py-2 text-sm text-text-muted">{t("contacts.detail.tasksEmpty")}</p>
              ) : (
                <ul className="space-y-2">
                  {linkedTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2">
                      <CalendarClock className="size-3.5 shrink-0 text-text-faint" />
                      <span className="min-w-0 flex-1">
                        <span className={task.done ? "block truncate text-sm text-text-muted line-through" : "block truncate text-sm text-text"}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="text-2xs text-text-faint">
                            {dateFormat.format(new Date(`${task.dueDate}T00:00:00`))}
                            {task.dueTime ? `, ${task.dueTime} Uhr` : ""}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate("/app/tasks")}>
                <Plus className="size-4" />
                {t("contacts.detail.newTask")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        defaultAssignee={contact.assignee}
        assignees={contacts.assignees.length > 0 ? contacts.assignees : [contact.assignee]}
        onSubmit={(draft) => {
          contacts.update(contact.id, draft);
          toast(t("contacts.toast.updated"), { description: `${draft.firstName} ${draft.lastName}`.trim() });
        }}
      />

      <LogActivityDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        onSubmit={(entry) => {
          contacts.logActivity({ ...entry, contactId: contact.id, timestamp: new Date().toISOString() });
          toast(t("contacts.detail.logSaved"), { description: entry.description });
        }}
        defaultChannel={contact.phone ? "telefon" : "email"}
        author={user?.name ?? ""}
      />
    </div>
  );
}

function ChannelRow({ icon, value, href }: { icon: React.ReactNode; value: string; href?: string }) {
  const content = (
    <span className="flex items-center gap-2.5 text-sm">
      <span className="text-text-faint">{icon}</span>
      <span className="min-w-0 truncate text-text">{value}</span>
    </span>
  );

  if (!href) return <div className="rounded-md px-1 py-1.5">{content}</div>;
  return (
    <a
      href={href}
      className="block rounded-md px-1 py-1.5 transition-colors duration-[var(--t-fast)] hover:bg-surface-hover"
    >
      {content}
    </a>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-2xs text-text-faint">{label}</span>
      <span className="min-w-0 flex-1 text-text">{value}</span>
    </div>
  );
}

function LogActivityDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultChannel,
  author,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: { channel: Channel; direction: "eingehend" | "ausgehend"; description: string }) => void;
  defaultChannel: Channel;
  author: string;
}) {
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [direction, setDirection] = useState<"eingehend" | "ausgehend">("ausgehend");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t("contacts.detail.logDialogTitle")} description={t("contacts.detail.logDialogDescription")}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!description.trim()) {
              setError(t("contacts.detail.logRequired"));
              return;
            }
            onSubmit({ channel, direction, description: description.trim() });
            setDescription("");
            setError(null);
            onOpenChange(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("contacts.detail.logChannel")}
              value={channel}
              onChange={(event) => setChannel(event.target.value as Channel)}
              options={LOG_CHANNELS.map((entry) => ({ value: entry, label: t(`contacts.source.${entry}`) }))}
            />
            <Select
              label={t("contacts.detail.logDirection")}
              value={direction}
              onChange={(event) => setDirection(event.target.value as "eingehend" | "ausgehend")}
              options={[
                { value: "ausgehend", label: t("contacts.detail.logOutgoing") },
                { value: "eingehend", label: t("contacts.detail.logIncoming") },
              ]}
            />
          </div>

          <Input
            label={t("contacts.detail.logDescription")}
            placeholder={t("contacts.detail.logDescriptionPlaceholder")}
            value={description}
            onChange={(event) => {
              if (error) setError(null);
              setDescription(event.target.value);
            }}
            error={error ?? undefined}
            autoFocus
          />

          {author && <p className="text-2xs text-text-faint">{author}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("contacts.detail.logSave")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
