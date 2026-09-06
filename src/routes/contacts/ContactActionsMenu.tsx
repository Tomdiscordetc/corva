import { MoreHorizontal, Pencil, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { PIPELINE_STAGES, type Contact, type PipelineStage } from "@/demo/contacts";
import { t } from "@/i18n";

interface ContactActionsMenuProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (stage: PipelineStage) => void;
}

/**
 * Aktionen zu einem Kontakt — über die Schaltfläche und per Rechtsklick auf
 * die Zeile. Der Stufenwechsel liegt hier zusätzlich zum Ziehen, damit er
 * auch per Tastatur und auf dem Handy erreichbar ist.
 */
export function ContactActionsMenu({
  contact,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  onMove,
}: ContactActionsMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("contacts.row.actions")}
          className="flex size-8 items-center justify-center rounded-md text-text-faint transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onOpen}>
          <SquareArrowOutUpRight className="size-3.5" />
          {t("contacts.row.open")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="size-3.5" />
          {t("contacts.row.edit")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("contacts.row.moveTo")}</DropdownMenuLabel>
        {PIPELINE_STAGES.map((stage) => (
          <DropdownMenuItem key={stage} onSelect={() => onMove(stage)}>
            {contact.stage === stage ? "✓ " : ""}
            {t(`contacts.stage.${stage}`)}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 className="size-3.5" />
          {t("contacts.row.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
