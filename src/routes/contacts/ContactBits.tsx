import type { CSSProperties } from "react";
import { AtSign, Mail, MessageCircle, Phone, Radio } from "lucide-react";
import { daysSinceContact, isStale } from "@/lib/contactFilters";
import type { Channel } from "@/demo/dashboard";
import type { Contact, InsuranceBranch, PipelineStage } from "@/demo/contacts";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

/** Farbe je Stufe kommt aus theme.css, nie aus dem Baustein. */
export const STAGE_COLOR_VAR: Record<PipelineStage, string> = {
  neu: "--color-stage-neu",
  kontaktiert: "--color-stage-kontaktiert",
  beratung: "--color-stage-beratung",
  angebot: "--color-stage-angebot",
  abschluss: "--color-stage-abschluss",
  verloren: "--color-stage-verloren",
};

export function stageStyle(stage: PipelineStage): CSSProperties {
  return { "--stage-color": `var(${STAGE_COLOR_VAR[stage]})` } as CSSProperties;
}

/** Kleiner Farbpunkt für eine Stufe — auch allein verwendbar, etwa im Spaltenkopf. */
export function StageDot({ stage, className }: { stage: PipelineStage; className?: string }) {
  return (
    <span
      aria-hidden
      style={stageStyle(stage)}
      className={cn("size-1.5 shrink-0 rounded-full bg-[var(--stage-color)]", className)}
    />
  );
}

/**
 * Stufe als ruhige Pille: Farbe steckt im Punkt, der Text bleibt in der
 * normalen Textfarbe. Große farbige Flächen ließen die Liste bunt wirken;
 * so bleibt sie lesbar und der Blick fängt trotzdem die Stufe.
 */
export function StagePill({ stage }: { stage: PipelineStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-text">
      <StageDot stage={stage} />
      {t(`contacts.stage.${stage}`)}
    </span>
  );
}

export function BranchList({ branches, max = 2 }: { branches: InsuranceBranch[]; max?: number }) {
  if (branches.length === 0) return <span className="text-2xs text-text-faint">—</span>;
  const shown = branches.slice(0, max);
  const rest = branches.length - shown.length;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((branch) => (
        <span
          key={branch}
          className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-2xs whitespace-nowrap text-text-muted"
        >
          {t(`contacts.branch.${branch}`)}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-2xs text-text-faint" title={branches.slice(max).map((b) => t(`contacts.branch.${b}`)).join(", ")}>
          +{rest}
        </span>
      )}
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
    <span className={cn("inline-flex items-center gap-1.5 text-2xs", stale ? "text-warning" : "text-text-muted")}>
      {stale && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />}
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
