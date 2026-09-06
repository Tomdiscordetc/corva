import { LayoutGrid, Columns3, Rows3, Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { INSURANCE_BRANCHES, type InsuranceBranch } from "@/demo/contacts";
import { DEFAULT_CONTACT_FILTER, type ContactFilter, type ContactSort } from "@/lib/contactFilters";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export type ContactView = "table" | "cards" | "pipeline";

const SORTS: ContactSort[] = ["zuletzt", "name", "angelegt", "stufe"];
const VIEWS: { value: ContactView; Icon: typeof Rows3; labelKey: string }[] = [
  { value: "table", Icon: Rows3, labelKey: "contacts.view.table" },
  { value: "cards", Icon: LayoutGrid, labelKey: "contacts.view.cards" },
  { value: "pipeline", Icon: Columns3, labelKey: "contacts.view.pipeline" },
];

interface ContactToolbarProps {
  filter: ContactFilter;
  onFilterChange: (filter: ContactFilter) => void;
  assignees: string[];
  view: ContactView;
  onViewChange: (view: ContactView) => void;
  shown: number;
  total: number;
}

/**
 * Suche, Filter und Ansicht in einer Leiste statt in vier gestapelten Zeilen.
 * Gesetzte Filter erscheinen darunter als entfernbare Marken — so ist immer
 * sichtbar, warum die Liste kürzer ist als der Bestand.
 */
export function ContactToolbar({
  filter,
  onFilterChange,
  assignees,
  view,
  onViewChange,
  shown,
  total,
}: ContactToolbarProps) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filter.query.trim()) {
    chips.push({
      key: "query",
      label: t("contacts.filterChip.query", { value: filter.query.trim() }),
      clear: () => onFilterChange({ ...filter, query: "" }),
    });
  }
  if (filter.stage !== "alle") {
    chips.push({
      key: "stage",
      label: t(`contacts.stage.${filter.stage}`),
      clear: () => onFilterChange({ ...filter, stage: "alle" }),
    });
  }
  if (filter.branch !== "alle") {
    chips.push({
      key: "branch",
      label: t(`contacts.branch.${filter.branch}`),
      clear: () => onFilterChange({ ...filter, branch: "alle" }),
    });
  }
  if (filter.assignee !== "alle") {
    chips.push({
      key: "assignee",
      label: filter.assignee,
      clear: () => onFilterChange({ ...filter, assignee: "alle" }),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-2 shadow-[var(--shadow-soft)]">
        <div className="min-w-52 flex-1">
          <Input
            label={t("contacts.search")}
            hideLabel
            type="search"
            placeholder={t("contacts.search")}
            value={filter.query}
            onChange={(event) => onFilterChange({ ...filter, query: event.target.value })}
            trailing={<Search className="size-4" />}
            className="h-9 border-transparent bg-surface-subtle"
          />
        </div>

        <Select
          label={t("contacts.branch.label")}
          hideLabel
          value={filter.branch}
          onChange={(event) => onFilterChange({ ...filter, branch: event.target.value as InsuranceBranch | "alle" })}
          className="h-9 w-auto border-transparent bg-surface-subtle text-xs"
          options={[
            { value: "alle", label: t("contacts.branch.alle") },
            ...INSURANCE_BRANCHES.map((branch) => ({ value: branch, label: t(`contacts.branch.${branch}`) })),
          ]}
        />
        <Select
          label={t("contacts.assignee.label")}
          hideLabel
          value={filter.assignee}
          onChange={(event) => onFilterChange({ ...filter, assignee: event.target.value })}
          className="h-9 w-auto border-transparent bg-surface-subtle text-xs"
          options={[
            { value: "alle", label: t("contacts.assignee.alle") },
            ...assignees.map((name) => ({ value: name, label: name })),
          ]}
        />
        <Select
          label={t("contacts.sort.label")}
          hideLabel
          value={filter.sort}
          onChange={(event) => onFilterChange({ ...filter, sort: event.target.value as ContactSort })}
          className="h-9 w-auto border-transparent bg-surface-subtle text-xs"
          options={SORTS.map((sort) => ({ value: sort, label: t(`contacts.sort.${sort}`) }))}
        />

        <div className="ml-auto flex items-center gap-0.5 rounded-md bg-surface-muted p-0.5" role="group" aria-label={t("contacts.view.label")}>
          {VIEWS.map(({ value, Icon, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => onViewChange(value)}
              aria-pressed={view === value}
              aria-label={t(labelKey)}
              title={t(labelKey)}
              className={cn(
                "flex size-8 items-center justify-center rounded-sm transition-colors duration-[var(--t-fast)]",
                view === value
                  ? "bg-surface text-text shadow-[var(--shadow-soft)]"
                  : "text-text-faint hover:text-text",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs text-text-faint">{t("contacts.count", { count: shown, total })}</span>

        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.clear}
            aria-label={t("contacts.filterChip.remove", { label: chip.label })}
            className="group inline-flex max-w-56 items-center gap-1 rounded-full border border-line bg-surface py-0.5 pr-1.5 pl-2.5 text-2xs text-text-muted transition-colors duration-[var(--t-fast)] hover:border-line-strong hover:text-text"
          >
            <span className="truncate">{chip.label}</span>
            <X className="size-3 shrink-0 text-text-faint transition-colors duration-[var(--t-fast)] group-hover:text-text" />
          </button>
        ))}

        {chips.length > 1 && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...DEFAULT_CONTACT_FILTER, sort: filter.sort })}
            className="text-2xs font-medium text-accent-text transition-opacity duration-[var(--t-fast)] hover:opacity-75"
          >
            {t("contacts.filterChip.clearAll")}
          </button>
        )}
      </div>
    </div>
  );
}
