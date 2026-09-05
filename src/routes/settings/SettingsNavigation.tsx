import { Link, useSearchParams } from "react-router-dom";
import { Bell, ChevronRight, Keyboard, Link2, Palette, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export const SETTINGS_SECTIONS = [
  { id: "appearance", Icon: Palette },
  { id: "notifications", Icon: Bell },
  { id: "account", Icon: UserRound },
  { id: "connections", Icon: Link2 },
] as const;

export function SettingsNavigation({ inContextPanel = false }: { inContextPanel?: boolean }) {
  const [searchParams] = useSearchParams();
  const selected = SETTINGS_SECTIONS.find((item) => item.id === searchParams.get("section"))?.id ?? "appearance";
  return <>
    <nav aria-label={t("settings.navigation")} className={cn("flex gap-2 pb-2", inContextPanel ? "flex-col" : "overflow-x-auto xl:flex-col xl:overflow-visible")}>
      <p className={cn("mb-2 px-3 text-2xs font-medium tracking-widest text-text-faint", !inContextPanel && "hidden xl:block")}>{t("settings.personal")}</p>
      {SETTINGS_SECTIONS.map(({ id, Icon }) => {
        const next = new URLSearchParams(searchParams);
        next.set("section", id);
        return <Link key={id} to={`?${next}`} preventScrollReset aria-current={id === selected ? "page" : undefined}
          className={cn("flex shrink-0 items-center gap-2.5 rounded-md px-3 py-3 text-xs font-medium transition-colors duration-[var(--t-fast)]", id === selected ? "bg-surface-raised text-text shadow-[var(--shadow-soft)] ring-1 ring-line" : "text-text-muted hover:bg-surface-hover hover:text-text", id === "connections" && (inContextPanel ? "mt-5" : "xl:mt-5"))}>
          <Icon className={cn("size-4 shrink-0", id === selected && "text-accent-text")} aria-hidden />
          {t(`settings.${id}.nav`)}
          {id === selected && <ChevronRight className={cn("ml-auto size-3.5 text-text-faint", !inContextPanel && "hidden xl:block")} aria-hidden />}
        </Link>;
      })}
    </nav>
    <div className={cn("mt-9 border-t border-line px-3 pt-5", !inContextPanel && "hidden xl:block")}>
      <Keyboard className="mb-3 size-5 text-text-faint" aria-hidden />
      <p className="text-xs font-medium text-text">{t("settings.appearance.tipTitle")}</p>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">{t("settings.appearance.tipText")}</p>
      <div aria-hidden className="mt-3 flex gap-1.5">{["G", "E"].map((key) => <kbd key={key} className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-2xs text-text-muted">{key}</kbd>)}</div>
    </div>
  </>;
}
