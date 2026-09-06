import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { contactName, PIPELINE_STAGES, type Contact, type PipelineStage } from "@/demo/contacts";
import { BranchList, LastContact } from "./ContactBits";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

interface ContactPipelineProps {
  contacts: Contact[];
  onMove: (contact: Contact, stage: PipelineStage) => void;
  onOpen: (contact: Contact) => void;
}

/**
 * Pipeline als Spalten. Das Ziehen läuft über dnd-kit, weil es die
 * Tastaturbedienung und die Ansagen für Screenreader mitbringt — mit reinem
 * Maus-Ziehen wäre die Stufe für einen Teil der Nutzer nicht erreichbar.
 * Zusätzlich lässt sich die Stufe im Kontextmenü jeder Karte setzen.
 */
export function ContactPipeline({ contacts, onMove, onOpen }: ContactPipelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // Erst ab etwas Weg ziehen, sonst verschluckt der Griff jeden Klick.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const active = activeId ? contacts.find((contact) => contact.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active: dragged, over } = event;
    if (!over) return;

    const contact = contacts.find((entry) => entry.id === dragged.id);
    if (!contact) return;

    // Abgelegt wird entweder auf einer Spalte oder auf einer Karte darin.
    const overStage = (over.data.current?.stage ?? over.id) as PipelineStage;
    if (!PIPELINE_STAGES.includes(overStage) || overStage === contact.stage) return;
    onMove(contact, overStage);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active: a }) => announce("announceStart", a.id, contacts),
          onDragOver: ({ over }) => (over ? overAnnouncement(over.id) : undefined),
          onDragEnd: ({ active: a, over }) =>
            over ? overAnnouncement(over.id, a.id, contacts, "announceDrop") : undefined,
          onDragCancel: ({ active: a }) => announce("announceCancel", a.id, contacts),
        },
      }}
    >
      <p className="text-2xs text-text-faint">{t("contacts.pipeline.dragHint")}</p>

      <div className="grid gap-3 overflow-x-auto pb-2 [grid-auto-columns:minmax(220px,1fr)] [grid-auto-flow:column]">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            contacts={contacts.filter((contact) => contact.stage === stage)}
            onOpen={onOpen}
          />
        ))}
      </div>

      <DragOverlay>{active ? <PipelineCard contact={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function announce(key: string, id: string | number, contacts: Contact[]) {
  const contact = contacts.find((entry) => entry.id === id);
  if (!contact) return undefined;
  return t(`contacts.pipeline.${key}`, {
    name: contactName(contact),
    stage: t(`contacts.stage.${contact.stage}`),
  });
}

function overAnnouncement(
  overId: string | number,
  activeId?: string | number,
  contacts: Contact[] = [],
  key = "announceOver",
) {
  const stage = String(overId) as PipelineStage;
  if (!PIPELINE_STAGES.includes(stage)) return undefined;
  const name = activeId ? contactName(contacts.find((c) => c.id === activeId) ?? { firstName: "", lastName: "" }) : "";
  return t(`contacts.pipeline.${key}`, { name, stage: t(`contacts.stage.${stage}`) });
}

function StageColumn({
  stage,
  contacts,
  onOpen,
}: {
  stage: PipelineStage;
  contacts: Contact[];
  onOpen: (contact: Contact) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } });

  return (
    <section
      ref={setNodeRef}
      aria-label={t(`contacts.stage.${stage}`)}
      className={cn(
        "flex min-h-40 flex-col gap-2 rounded-md border border-line bg-surface-sunken p-2.5",
        "transition-colors duration-[var(--t-fast)]",
        isOver && "border-accent bg-accent-tint",
      )}
    >
      <p className="flex items-center justify-between px-1 text-2xs font-medium text-text-muted">
        {t(`contacts.stage.${stage}`)}
        <span className="text-text-faint">{contacts.length}</span>
      </p>

      <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <SortablePipelineCard key={contact.id} contact={contact} onOpen={() => onOpen(contact)} />
          ))}
        </ul>
      </SortableContext>

      {contacts.length === 0 && (
        <p className="px-1 py-4 text-center text-2xs text-text-faint">{t("contacts.pipeline.empty")}</p>
      )}
    </section>
  );
}

function SortablePipelineCard({ contact, onOpen }: { contact: Contact; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: contact.id,
    data: { stage: contact.stage },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <PipelineCard contact={contact} onOpen={onOpen} handleProps={{ ...attributes, ...listeners }} />
    </li>
  );
}

function PipelineCard({
  contact,
  onOpen,
  handleProps,
  dragging = false,
}: {
  contact: Contact;
  onOpen?: () => void;
  handleProps?: Record<string, unknown>;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-line bg-surface p-2.5",
        dragging && "shadow-[var(--shadow-raised)]",
      )}
    >
      <button
        type="button"
        aria-label={t("contacts.pipeline.grab", { name: contactName(contact) })}
        className="mt-0.5 cursor-grab touch-none text-text-faint transition-colors duration-[var(--t-fast)] hover:text-text active:cursor-grabbing"
        {...handleProps}
      >
        <GripVertical className="size-4" />
      </button>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left" disabled={!onOpen}>
        <span className="flex items-center gap-2">
          <Avatar name={contactName(contact)} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-text">{contactName(contact)}</span>
            <LastContact contact={contact} />
          </span>
        </span>
        <span className="mt-2 block">
          <BranchList branches={contact.branches} max={2} />
        </span>
      </button>
    </div>
  );
}
