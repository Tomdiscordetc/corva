import { useId, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { Bell, Check, ChevronRight, CircleHelp, CloudOff, Keyboard, Link2, LockKeyhole, Mail, MessageCircle, Monitor, Moon, Palette, PanelLeft, Phone, ShieldCheck, Sun, UserRound, type LucideIcon } from "lucide-react";
import { useAuthStore, ROLE_LABELS } from "@/store/auth";
import { useSettings } from "@/hooks/useSettings";
import { PLANNED_CONNECTIONS, type NotificationPreference } from "@/demo/settings";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";
import { ThemePreview } from "./ThemePreview";
import "./settings.css";

const SECTIONS = [
  { id: "appearance", Icon: Palette },
  { id: "notifications", Icon: Bell },
  { id: "account", Icon: UserRound },
  { id: "connections", Icon: Link2 },
] as const;
const THEMES = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
] as const;
const CHANNEL_ICONS: Record<(typeof PLANNED_CONNECTIONS)[number], LucideIcon> = {
  email: Mail, phone: Phone, whatsapp: MessageCircle, social: Link2,
};

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const id = useId();
  return (
    <Card role="group" aria-labelledby={id} className="overflow-hidden shadow-none">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h3 id={id} className="text-sm font-semibold text-text">{title}</h3>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-text-muted">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}

function Row({ title, description, children, labelId }: { title: string; description: string; children: ReactNode; labelId?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 last:border-b-0 sm:px-6">
      <div className="min-w-0 flex-1 basis-44">
        {labelId ? <label htmlFor={labelId} className="text-sm font-medium text-text">{title}</label> : <p className="text-sm font-medium text-text">{title}</p>}
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-line bg-surface-subtle px-2.5 py-1 text-2xs font-medium text-text-muted">{children}</span>;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-accent/15 bg-accent-tint px-4 py-3 text-xs leading-relaxed text-accent-text">
      <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

export function SettingsPage() {
  const email = useAuthStore((s) => s.user?.email ?? "");
  return <SettingsContent key={email} email={email} />;
}

function SettingsContent({ email }: { email: string }) {
  const settings = useSettings(email);
  const user = useAuthStore((s) => s.user);
  const previewRole = useAuthStore((s) => s.previewRole);
  const logout = useAuthStore((s) => s.logout);
  const reduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const section = SECTIONS.find((item) => item.id === searchParams.get("section"))?.id ?? "appearance";

  function sectionLink(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("section", id);
    return `?${next.toString()}`;
  }

  function notificationRow(key: NotificationPreference) {
    return (
      <Row key={key} labelId={`notification-${key}`} title={t(`settings.notifications.${key}`)} description={t(`settings.notifications.${key}Hint`)}>
        <Switch id={`notification-${key}`} checked={settings.notifications[key]} onCheckedChange={(value) => settings.changeNotification(key, value)} />
      </Row>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="mb-2 text-2xs font-semibold tracking-widest text-text-muted">{t("settings.eyebrow")}</p>
          <h1 className="text-xl font-semibold tracking-tight text-text">{t("settings.title")}</h1>
          <p className="mt-2 text-sm text-text-muted">{t("settings.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted" role="status" aria-live="polite">
          {settings.feedback === "saved" ? <Check className="size-3.5 text-positive" aria-hidden /> : <Monitor className="size-3.5" aria-hidden />}
          {t(settings.feedback === "saved" ? "settings.saved" : "settings.device")}
        </div>
      </header>

      <div className="grid min-w-0 gap-7 xl:grid-cols-4 xl:gap-10">
        <aside className="min-w-0">
          <nav aria-label={t("settings.navigation")} className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">
            <p className="mb-2 hidden px-3 text-2xs font-medium tracking-widest text-text-faint xl:block">{t("settings.personal")}</p>
            {SECTIONS.map(({ id, Icon }) => (
              <Link key={id} to={sectionLink(id)} preventScrollReset aria-current={id === section ? "page" : undefined}
                className={cn("flex shrink-0 items-center gap-2.5 rounded-md px-3 py-3 text-xs font-medium transition-colors duration-[var(--t-fast)]", id === section ? "bg-surface-raised text-text shadow-[var(--shadow-soft)] ring-1 ring-line" : "text-text-muted hover:bg-surface-hover hover:text-text", id === "connections" && "xl:mt-5")}>
                <Icon className={cn("size-4 shrink-0", id === section && "text-accent-text")} aria-hidden />
                {t(`settings.${id}.nav`)}
                {id === section && <ChevronRight className="ml-auto hidden size-3.5 text-text-faint xl:block" aria-hidden />}
              </Link>
            ))}
          </nav>
          <div className="mt-9 hidden border-t border-line px-3 pt-5 xl:block">
            <Keyboard className="mb-3 size-5 text-text-faint" aria-hidden />
            <p className="text-xs font-medium text-text">{t("settings.appearance.tipTitle")}</p>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">{t("settings.appearance.tipText")}</p>
            <div aria-hidden className="mt-3 flex gap-1.5">
              {["G", "E"].map((key) => <kbd key={key} className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-2xs text-text-muted">{key}</kbd>)}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5 xl:col-span-3">
          {settings.feedback === "error" && <p role="alert" className="rounded-md border border-danger/20 bg-danger-tint p-4 text-xs text-danger">{t("settings.saveError")}</p>}
          <section key={section} className="settings-panel space-y-5" aria-labelledby="settings-section-heading">
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="settings-section-heading" className="text-lg font-semibold tracking-tight text-text">{t(`settings.${section}.title`)}</h2>
                {section === "notifications" && <Badge>{t("settings.preview")}</Badge>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{t(`settings.${section}.subtitle`)}</p>
            </div>

            {section === "appearance" && <>
              <Group title={t("settings.appearance.theme")} subtitle={t("settings.appearance.themeHint")}>
                <fieldset className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 sm:p-6">
                  <legend className="sr-only">{t("settings.appearance.theme")}</legend>
                  {THEMES.map(({ value, Icon }) => (
                    <label key={value} className="group relative min-w-0 cursor-pointer">
                      <input type="radio" name="settings-theme" value={value} checked={settings.theme === value} onChange={() => settings.changeTheme(value)} className="peer sr-only" />
                      <span className={cn("block rounded-lg border p-2 transition-[border-color,box-shadow] duration-[var(--t-fast)] peer-focus-visible:ring-4 peer-focus-visible:ring-accent-tint", settings.theme === value ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong")}>
                        <ThemePreview theme={value} />
                        <span className="flex items-center gap-2 px-1 pb-1 pt-3 text-xs font-medium text-text"><Icon className="size-3.5" aria-hidden />{t(`topbar.theme${value[0].toUpperCase()}${value.slice(1)}`)}
                          {settings.theme === value && <Check className="ml-auto size-3.5 text-accent-text" aria-hidden />}
                        </span>
                        <span className="block px-1 pb-2 text-2xs text-text-muted">{t(`settings.appearance.${value}Hint`)}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </Group>

              <Group title={t("settings.appearance.density")} subtitle={t("settings.appearance.densityHint")}>
                <fieldset className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
                  <legend className="sr-only">{t("settings.appearance.density")}</legend>
                  {(["comfortable", "compact"] as const).map((value) => (
                    <label key={value} className="relative cursor-pointer">
                      <input type="radio" name="settings-density" value={value} checked={settings.density === value} onChange={() => settings.changeDensity(value)} className="peer sr-only" />
                      <span className={cn("flex h-full items-center gap-4 rounded-md border p-4 transition-colors duration-[var(--t-fast)] peer-focus-visible:ring-4 peer-focus-visible:ring-accent-tint", settings.density === value ? "border-accent bg-accent-tint/30" : "border-line hover:border-line-strong")}>
                        <span aria-hidden className={cn("flex w-9 shrink-0 flex-col", value === "comfortable" ? "gap-2" : "gap-1")}>
                          {[0, 1, 2].map((i) => <span key={i} className="h-1.5 rounded-full bg-text-muted/35" />)}
                        </span>
                        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-text">{t(value === "comfortable" ? "topbar.densityComfortable" : "topbar.densityCompact")}</span><span className="mt-1 block text-2xs leading-relaxed text-text-muted">{t(`settings.appearance.${value}Hint`)}</span></span>
                        {settings.density === value && <Check className="size-3.5 shrink-0 text-accent-text" aria-hidden />}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </Group>

              <Group title={t("settings.appearance.layout")}>
                <Row labelId="settings-context-panel" title={t("settings.appearance.sidebar")} description={t("settings.appearance.sidebarHint")}>
                  <Switch id="settings-context-panel" checked={settings.contextPanelOpen} onCheckedChange={settings.changeContextPanel} />
                </Row>
                <Row title={t("settings.appearance.shortcuts")} description={t("settings.appearance.shortcutsHint")}>
                  <Button variant="secondary" size="sm" onClick={settings.showShortcuts}><Keyboard className="size-3.5" aria-hidden />{t("settings.appearance.showShortcuts")}</Button>
                </Row>
                <Row title={t("settings.appearance.motion")} description={t("settings.appearance.motionHint")}>
                  <Badge>{t(reduceMotion ? "settings.appearance.motionReduced" : "settings.appearance.motionSystem")}</Badge>
                </Row>
              </Group>
              <p className="flex items-center gap-2 px-1 text-2xs text-text-muted"><PanelLeft className="size-3.5" aria-hidden />{t("settings.localHint")}</p>
            </>}

            {section === "notifications" && <>
              <Notice>{t("settings.notifications.notice")}</Notice>
              <Group title={t("settings.notifications.events")}>
                {(["inquiries", "assignments", "appointments", "summary"] as const).map(notificationRow)}
              </Group>
              <Group title={t("settings.notifications.delivery")}>{notificationRow("email")}</Group>
              <p className="text-xs leading-relaxed text-text-muted">{t("settings.notifications.future")}</p>
            </>}

            {section === "account" && user && <>
              <Group title={t("settings.account.profile")} subtitle={t("settings.account.profileHint")}>
                <div className="flex items-center gap-4 border-b border-line px-5 py-5 sm:px-6"><Avatar name={user.name} size="lg" /><div className="min-w-0"><p className="break-words text-sm font-semibold text-text">{user.name}</p><p className="mt-1 break-all text-xs text-text-muted">{user.email}</p></div></div>
                <dl className="space-y-5 px-5 py-5 sm:px-6">
                  {[[t("settings.account.name"), user.name], [t("settings.account.email"), user.email], [t("settings.account.role"), ROLE_LABELS[user.role]], ...(previewRole ? [[t("settings.account.previewRole"), ROLE_LABELS[previewRole]]] : [])].map(([label, value]) => <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-4"><dt className="text-xs text-text-muted">{label}</dt><dd className="break-words text-xs font-medium text-text sm:col-span-2">{value}</dd></div>)}
                </dl>
                <p className="border-t border-line bg-surface-subtle px-5 py-3 text-2xs text-text-muted sm:px-6">{t("settings.account.readOnly")}</p>
              </Group>
              <Group title={t("settings.account.security")} subtitle={t("settings.account.securityHint")}>
                {(["password", "twoFactor", "sessions"] as const).map((key) => <Row key={key} title={t(`settings.account.${key}`)} description={t(`settings.account.${key}Hint`)}><Badge>{t("settings.planned")}</Badge></Row>)}
              </Group>
              <Group title={t("settings.account.session")}>
                <Row title={t("settings.account.logout")} description={t("settings.account.sessionHint")}><Button variant="secondary" size="sm" onClick={logout}><LockKeyhole className="size-3.5" aria-hidden />{t("settings.account.logout")}</Button></Row>
              </Group>
            </>}

            {section === "connections" && <>
              <Notice>{t("settings.connections.notice")}</Notice>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PLANNED_CONNECTIONS.map((key) => {
                  const Icon = CHANNEL_ICONS[key];
                  return <Card key={key} className="p-5 shadow-none sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div className="flex size-11 items-center justify-center rounded-md border border-line bg-surface-subtle text-text"><Icon className="size-5" aria-hidden /></div><Badge>{t("settings.planned")}</Badge></div><h3 className="text-sm font-semibold text-text">{t(`settings.connections.${key}`)}</h3><p className="mt-2 text-xs leading-relaxed text-text-muted">{t(`settings.connections.${key}Hint`)}</p></Card>;
                })}
              </div>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-text-muted"><CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden />{t("settings.connections.footer")}</p>
            </>}
          </section>
          <footer className="flex items-center gap-2 border-t border-line pt-5 text-2xs text-text-faint"><ShieldCheck className="size-3.5 shrink-0" aria-hidden />{t("settings.localHint")}</footer>
        </div>
      </div>
    </div>
  );
}
