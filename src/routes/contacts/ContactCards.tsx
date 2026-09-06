import { useState, type MouseEvent } from "react";
import { Mail, MapPin, MessageCircle, Phone, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { contactName, type Contact, type PipelineStage } from "@/demo/contacts";
import { BranchList, LastContact, SourceIcon, StagePill } from "./ContactBits";
import { ContactActionsMenu } from "./ContactActionsMenu";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

interface ContactCardsProps {
  contacts: Contact[];
  onOpen: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onMove: (contact: Contact, stage: PipelineStage) => void;
}

export function ContactCards({ contacts, onOpen, onEdit, onDelete, onMove }: ContactCardsProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onOpen={() => onOpen(contact)}
          onEdit={() => onEdit(contact)}
          onDelete={() => onDelete(contact)}
          onMove={(stage) => onMove(contact, stage)}
        />
      ))}
    </ul>
  );
}

function ContactCard({
  contact,
  onOpen,
  onEdit,
  onDelete,
  onMove,
}: {
  contact: Contact;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (stage: PipelineStage) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const reduceMotion = useReducedMotion();

  function openMenu(event: MouseEvent) {
    event.preventDefault();
    setMenuOpen(true);
  }

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      onContextMenu={openMenu}
      className="relative overflow-hidden rounded-md border border-line bg-surface"
    >
      {/*
        Erst beim Ziehen sichtbar: sonst blitzt die rote Fläche an der Kante
        der Karte durch und die Liste wirkt unsauber.
      */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 bg-danger px-5 text-sm font-medium text-neutral-0",
          "transition-opacity duration-[var(--t-fast)]",
          swiping ? "opacity-100" : "opacity-0",
        )}
      >
        <Trash2 className="size-4" />
        {t("contacts.row.delete")}
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
        className="relative bg-surface p-4"
      >
        <div className="flex items-start gap-3">
          <Avatar name={contactName(contact)} size="md" />
          <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-text">{contactName(contact)}</span>
              <SourceIcon source={contact.source} />
            </span>
            {contact.city && (
              <span className="mt-0.5 flex items-center gap-1 text-2xs text-text-faint">
                <MapPin className="size-3" />
                {contact.city}
              </span>
            )}
          </button>
          <ContactActionsMenu
            contact={contact}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StagePill stage={contact.stage} />
          <BranchList branches={contact.branches} />
        </div>

        {contact.notes && <p className="mt-3 line-clamp-2 text-xs text-text-muted">{contact.notes}</p>}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="flex items-center gap-2 text-text-faint">
            {contact.email && <Mail className="size-3.5" aria-label={t("contacts.field.email")} role="img" />}
            {contact.phone && <Phone className="size-3.5" aria-label={t("contacts.field.phone")} role="img" />}
            {contact.whatsapp && (
              <MessageCircle className="size-3.5" aria-label={t("contacts.field.whatsapp")} role="img" />
            )}
          </span>
          <LastContact contact={contact} />
        </div>
      </motion.div>
    </motion.li>
  );
}
