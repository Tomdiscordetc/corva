import { useState, type MouseEvent } from "react";
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
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-soft)]">
      <div className="max-h-[calc(100dvh-22rem)] overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          {/* Kopf bleibt beim Blättern stehen — bei langen Listen sonst Ratespiel. */}
          <thead className="sticky top-0 z-10 bg-surface-subtle/95 backdrop-blur-sm">
            <tr className="border-b border-line">
              <Th className="w-[30%]">{t("contacts.column.name")}</Th>
              <Th className="w-[14%]">{t("contacts.column.stage")}</Th>
              <Th className="w-[22%]">{t("contacts.column.branches")}</Th>
              <Th className="w-[16%]">{t("contacts.column.assignee")}</Th>
              <Th className="w-[16%]">{t("contacts.column.lastContact")}</Th>
              <th className="w-10 px-2" />
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
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-4 py-2.5 text-2xs font-medium tracking-wide whitespace-nowrap text-text-faint uppercase ${className ?? ""}`}
    >
      {children}
    </th>
  );
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

  function openMenu(event: MouseEvent) {
    event.preventDefault();
    setMenuOpen(true);
  }

  return (
    <tr
      onContextMenu={openMenu}
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen();
      }}
      aria-label={contactName(contact)}
      className="group cursor-pointer border-b border-line transition-colors duration-[var(--t-fast)] last:border-0 hover:bg-surface-subtle focus-visible:bg-surface-subtle"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={contactName(contact)} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-text">{contactName(contact)}</span>
              <SourceIcon source={contact.source} />
            </div>
            <span className="block truncate text-2xs text-text-faint">
              {[contact.city, contact.email || contact.phone].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StagePill stage={contact.stage} />
      </td>
      <td className="px-4 py-3">
        <BranchList branches={contact.branches} />
      </td>
      <td className="px-4 py-3">
        <span className="truncate text-2xs text-text-muted">{contact.assignee}</span>
      </td>
      <td className="px-4 py-3">
        <LastContact contact={contact} />
      </td>
      <td className="px-2 py-3">
        {/*
          Die Schaltfläche tritt zurück, bis die Zeile gebraucht wird — sonst
          steht in jeder Zeile ein Punktehaufen. Über Tastatur und Rechtsklick
          bleibt sie jederzeit erreichbar.
        */}
        <div
          onClick={(event) => event.stopPropagation()}
          className="opacity-0 transition-opacity duration-[var(--t-fast)] group-hover:opacity-100 group-focus-within:opacity-100 data-[open=true]:opacity-100"
          data-open={menuOpen}
        >
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
      </td>
    </tr>
  );
}
