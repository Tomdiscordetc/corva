import { AtSign, Mail, MessageCircle, Phone, Radio } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { daysSinceContact, isStale } from "@/lib/contactFilters";
import type { Channel } from "@/demo/dashboard";
import type { Contact, InsuranceBranch, PipelineStage } from "@/demo/contacts";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

const STAGE_TONE: Record<PipelineStage, "neutral" | "accent" | "warning" | "positive" | "danger"> = {
  neu: "accent",
  kontaktiert: "neutral",
  beratung: "neutral",
  angebot: "warning",
  abschluss: "positive",
  verloren: "danger",
};

export function StagePill({ stage }: { stage: PipelineStage }) {
  return <StatusPill tone={STAGE_TONE[stage]}>{t(`contacts.stage.${stage}`)}</StatusPill>;
}

export function BranchList({ branches, max = 2 }: { branches: InsuranceBranch[]; max?: number }) {
  if (branches.length === 0) return <span className="text-text-faint">—</span>;
  const shown = branches.slice(0, max);
  const rest = branches.length - shown.length;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((branch) => (
        <span key={branch} className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-2xs text-text-muted">
          {t(`contacts.branch.${branch}`)}
        </span>
      ))}
      {rest > 0 && <span className="text-2xs text-text-faint">+{rest}</span>}
    </span>
  );
}

/** Zeigt, wie lange der letzte Kontakt her ist — und warnt, wenn es zu lange ist. */
export function LastContact({ contact }: { contact: Contact }) {
  const since = daysSinceContact(contact);
  const stale = isStale(contact);

  if (since === null) {
    return <span className="text-2xs font-medium text-accent-text">{t("contacts.row.never")}</span>;
  }

  const label =
    since === 0
      ? t("contacts.row.today")
      : since === 1
        ? t("contacts.row.yesterday")
        : t("contacts.row.daysAgo", { days: since });

  return (
    <span className={cn("text-2xs", stale ? "font-medium text-warning" : "text-text-muted")}>
      {label}
    </span>
  );
}

const CHANNEL_ICON: Record<Channel, typeof Mail> = {
  email: Mail,
  telefon: Phone,
  whatsapp: MessageCircle,
  instagram: AtSign,
  meta: Radio,
  tiktok: Radio,
};

export function SourceIcon({ source }: { source: Channel }) {
  const Icon = CHANNEL_ICON[source];
  const label = t(`contacts.source.${source}`);
  return <Icon className="size-3.5 shrink-0 text-text-faint" aria-label={label} role="img" />;
}
