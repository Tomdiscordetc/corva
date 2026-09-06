import { useState, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { contactName, type Contact, type PipelineStage } from "@/demo/contacts";
import { BranchList, LastContact, SourceIcon, StagePill } from "./ContactBits";
import { ContactActionsMenu } from "./ContactActionsMenu";
import { t } from "@/i18n";

interface ContactTableProps {
  contacts: Contact[];
  onOpen: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onMove: (contact: Contact, stage: PipelineStage) => void;
}

export function ContactTable({ contacts, onOpen, onEdit, onDelete, onMove }: ContactTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-surface-subtle">
            <Th>{t("contacts.column.name")}</Th>
            <Th>{t("contacts.column.stage")}</Th>
            <Th>{t("contacts.column.branches")}</Th>
            <Th>{t("contacts.column.assignee")}</Th>
            <Th>{t("contacts.column.lastContact")}</Th>
            <th className="w-12 px-2" />
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <ContactTableRow
              key={contact.id}
              contact={contact}
              onOpen={() => onOpen(contact)}
              onEdit={() => onEdit(contact)}
              onDelete={() => onDelete(contact)}
              onMove={(stage) => onMove(contact, stage)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-2xs font-medium text-text-muted">{children}</th>;
}

function ContactTableRow({
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
  const reduceMotion = useReducedMotion();

  function openMenu(event: MouseEvent) {
    event.preventDefault();
    setMenuOpen(true);
  }

  return (
    <motion.tr
      layout={!reduceMotion}
      onContextMenu={openMenu}
      className="border-b border-line last:border-0 transition-colors duration-[var(--t-fast)] hover:bg-surface-subtle"
    >
      <td className="px-4 py-3">
        <button type="button" onClick={onOpen} className="flex items-center gap-2.5 text-left">
          <Avatar name={contactName(contact)} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-text">{contactName(contact)}</span>
              <SourceIcon source={contact.source} />
            </span>
            <span className="block truncate text-2xs text-text-faint">
              {contact.city || contact.email || contact.phone}
            </span>
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        <StagePill stage={contact.stage} />
      </td>
      <td className="px-4 py-3">
        <BranchList branches={contact.branches} />
      </td>
      <td className="px-4 py-3 text-2xs text-text-muted">{contact.assignee}</td>
      <td className="px-4 py-3">
        <LastContact contact={contact} />
      </td>
      <td className="px-2 py-3">
        <ContactActionsMenu
          contact={contact}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
        />
      </td>
    </motion.tr>
  );
}
