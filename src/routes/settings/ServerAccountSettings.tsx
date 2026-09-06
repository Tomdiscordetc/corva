import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, Download, KeyRound, Loader2, LogOut, Monitor, RefreshCw, ShieldCheck } from "lucide-react";
import { useAccountSettings, type AccountSession } from "@/hooks/useAccountSettings";
import { useAuthStore, ROLE_LABELS } from "@/store/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { t } from "@/i18n";
import { SettingsDialog, SettingsFeedback, SettingsGroup } from "./SettingsGroup";

type SecurityPanel = "password" | "enable" | "disable" | null;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date) : t("serverSettings.sessions.unknownDate");
}

function sessionLabel(session: AccountSession) {
  const agent = session.userAgent;
  const platform = /iPhone|iPad/i.test(agent) ? "iOS" : /Android/i.test(agent) ? "Android" : /Windows/i.test(agent) ? "Windows" : /Macintosh|Mac OS/i.test(agent) ? "macOS" : /Linux/i.test(agent) ? "Linux" : null;
  const browser = /Edg\//.test(agent) ? "Edge" : /Firefox\//.test(agent) ? "Firefox" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : null;
  return [browser, platform].filter(Boolean).join(" · ") || t("serverSettings.sessions.browser");
}

export function ServerAccountSettings() {
  const settings = useAccountSettings();
  const logout = useAuthStore((state) => state.logout);
  const [name, setName] = useState("");
  const [panel, setPanel] = useState<SecurityPanel>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: "session"; session: AccountSession } | { type: "others" | "logout" } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setName(settings.account?.user.name ?? ""); }, [settings.account?.user.name]);

  function clearSensitiveFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCode("");
    setSecret("");
    setRecoveryCodes([]);
    setAcknowledged(false);
    setFormError(null);
    setCopyStatus(null);
  }

  function openPanel(next: SecurityPanel) {
    clearSensitiveFields();
    settings.clearFeedback();
    setPanel(next);
  }

  function closePanel() {
    setPanel(null);
    clearSensitiveFields();
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 100) {
      setFormError(t("serverSettings.profile.nameError"));
      return;
    }
    setFormError(null);
    await settings.saveProfile(name);
  }

  async function saveSecurity(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setCopyStatus(null);
    if (panel === "password") {
      if (newPassword.length < 15 || newPassword.length > 128) {
        setFormError(t("serverSettings.password.requirements"));
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError(t("serverSettings.password.mismatch"));
        return;
      }
      const result = await settings.changePassword(currentPassword, newPassword, settings.account?.twoFactorEnabled ? code : undefined);
      if (result.ok) closePanel();
    } else if (panel === "enable" && !secret) {
      const result = await settings.setupTotp(currentPassword);
      if (result.ok) {
        setCurrentPassword("");
        setSecret(result.value.secret);
      }
    } else if (panel === "enable") {
      const result = await settings.enableTotp(code);
      if (result.ok) {
        setSecret("");
        setCode("");
        setRecoveryCodes(result.value.recoveryCodes);
      }
    } else if (panel === "disable") {
      const result = await settings.disableTotp(currentPassword, code);
      if (result.ok) closePanel();
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(t("serverSettings.copied"));
      setFormError(null);
    } catch {
      setFormError(t("serverSettings.copyError"));
    }
  }

  function downloadRecoveryCodes() {
    const text = [t("serverSettings.twoFactor.recoveryFileTitle"), settings.account?.user.email ?? "", "", ...recoveryCodes, "", t("serverSettings.twoFactor.recoveryFileHint")].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "corva-wiederherstellungscodes.txt";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function confirmSessionAction() {
    if (!confirmation) return;
    if (confirmation.type === "logout") {
      setLoggingOut(true);
      try { await logout(); } finally { setLoggingOut(false); }
      setConfirmation(null);
      return;
    }
    const result = await settings.revokeSession(confirmation.type === "session" ? confirmation.session.id : null);
    if (result.ok) setConfirmation(null);
  }

  const busy = settings.busy !== null;
  const account = settings.account;
  const hasRecoveryCodes = recoveryCodes.length > 0;
  const confirmationTitle = confirmation?.type === "logout" ? t("serverSettings.sessions.logoutTitle") : confirmation?.type === "others" ? t("serverSettings.sessions.othersTitle") : t("serverSettings.sessions.revokeTitle");
  const confirmationDescription = confirmation?.type === "logout" ? t("serverSettings.sessions.logoutHint") : confirmation?.type === "others" ? t("serverSettings.sessions.othersHint") : t("serverSettings.sessions.revokeHint", { device: confirmation?.type === "session" ? sessionLabel(confirmation.session) : "" });

  if (settings.loading && !account) return <p role="status" className="flex items-center gap-2 py-6 text-sm text-text-muted"><Loader2 className="size-4 animate-spin" aria-hidden />{t("serverSettings.loading")}</p>;
  if (!account) return <div className="space-y-4"><SettingsFeedback error={settings.loadError} /><Button variant="secondary" onClick={() => void settings.loadAccount()} loading={settings.loading}><RefreshCw className="size-4" aria-hidden />{t("serverSettings.retry")}</Button></div>;

  return <div className="space-y-5">
    {!panel && !confirmation && <SettingsFeedback error={formError ?? settings.error} success={settings.success} />}
    <SettingsGroup title={t("serverSettings.profile.title")} subtitle={t("serverSettings.profile.subtitle")}>
      <div className="flex items-center gap-4 border-b border-line px-5 py-5 sm:px-6"><Avatar name={account.user.name} size="lg" /><div className="min-w-0"><p className="break-words text-sm font-semibold text-text">{account.user.name}</p><p className="mt-1 break-all text-xs text-text-muted">{account.user.email}</p></div></div>
      <form onSubmit={(event) => void saveProfile(event)} className="space-y-5 p-5 sm:p-6">
        <Input label={t("serverSettings.profile.name")} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} maxLength={100} disabled={busy} />
        <div className="grid gap-5 sm:grid-cols-2"><Input label={t("serverSettings.profile.email")} value={account.user.email} readOnly hint={t("serverSettings.profile.emailHint")} /><Input label={t("serverSettings.profile.role")} value={ROLE_LABELS[account.user.role]} readOnly hint={t("serverSettings.profile.roleHint")} /></div>
        <div className="flex justify-end"><Button type="submit" size="sm" loading={settings.busy === "profile"} disabled={busy || name.trim() === account.user.name}><Check className="size-3.5" aria-hidden />{t("serverSettings.save")}</Button></div>
      </form>
    </SettingsGroup>

    <SettingsGroup title={t("serverSettings.security.title")} subtitle={t("serverSettings.security.subtitle")}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-6"><div className="min-w-0 flex-1 basis-44"><p className="text-sm font-medium text-text">{t("serverSettings.password.title")}</p><p className="mt-1 text-xs leading-relaxed text-text-muted">{t("serverSettings.password.hint")}</p></div><Button variant="secondary" size="sm" disabled={busy} onClick={() => openPanel("password")}><KeyRound className="size-3.5" aria-hidden />{t("serverSettings.password.change")}</Button></div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6"><div className="min-w-0 flex-1 basis-44"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-text">{t("serverSettings.twoFactor.title")}</p><span className="rounded-full border border-line bg-surface-subtle px-2.5 py-1 text-2xs text-text-muted">{t(account.twoFactorEnabled ? "serverSettings.twoFactor.enabled" : "serverSettings.twoFactor.disabled")}</span></div><p className="mt-1 text-xs leading-relaxed text-text-muted">{t("serverSettings.twoFactor.hint")}</p></div><Button variant="secondary" size="sm" disabled={busy} onClick={() => openPanel(account.twoFactorEnabled ? "disable" : "enable")}><ShieldCheck className="size-3.5" aria-hidden />{t(account.twoFactorEnabled ? "serverSettings.twoFactor.disable" : "serverSettings.twoFactor.enable")}</Button></div>
    </SettingsGroup>

    <SettingsGroup title={t("serverSettings.sessions.title")} subtitle={t("serverSettings.sessions.subtitle")}>
      <div className="space-y-4 p-5 sm:p-6">
        <SettingsFeedback error={settings.sessionsError} />
        <div className="flex flex-wrap justify-between gap-3"><Button variant="ghost" size="sm" onClick={() => void settings.loadSessions()} loading={settings.sessionsLoading} disabled={busy}><RefreshCw className="size-3.5" aria-hidden />{t("serverSettings.refresh")}</Button><Button variant="secondary" size="sm" disabled={busy || settings.sessionsLoading || !settings.sessions.some((session) => !session.current)} onClick={() => { settings.clearFeedback(); setConfirmation({ type: "others" }); }}>{t("serverSettings.sessions.revokeOthers")}</Button></div>
        {settings.sessionsLoading && settings.sessions.length === 0 && <p role="status" className="text-xs text-text-muted">{t("serverSettings.loading")}</p>}
        {!settings.sessionsLoading && !settings.sessionsError && settings.sessions.length === 0 && <p className="text-xs text-text-muted">{t("serverSettings.sessions.empty")}</p>}
        <ul className="divide-y divide-line">{settings.sessions.map((session) => <li key={session.id} className="flex flex-wrap items-start gap-3 py-4 first:pt-0 last:pb-0"><Monitor className="mt-1 size-4 shrink-0 text-text-muted" aria-hidden /><div className="min-w-0 flex-1 basis-44"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-text">{sessionLabel(session)}</p>{session.current && <span className="rounded-full bg-accent-tint px-2 py-1 text-2xs text-accent-text">{t("serverSettings.sessions.current")}</span>}</div><dl className="mt-2 space-y-1 text-2xs text-text-muted"><div><dt className="inline">{t("serverSettings.sessions.created")} </dt><dd className="inline">{formatDate(session.createdAt)}</dd></div><div><dt className="inline">{t("serverSettings.sessions.lastSeen")} </dt><dd className="inline">{formatDate(session.lastSeenAt)}</dd></div><div><dt className="inline">{t("serverSettings.sessions.expires")} </dt><dd className="inline">{formatDate(session.expiresAt)}</dd></div></dl></div>{!session.current && <Button variant="secondary" size="sm" disabled={busy} aria-label={t("serverSettings.sessions.revokeDevice", { device: sessionLabel(session) })} onClick={() => { settings.clearFeedback(); setConfirmation({ type: "session", session }); }}>{t("serverSettings.sessions.revoke")}</Button>}</li>)}</ul>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface-subtle px-5 py-4 sm:px-6"><p className="min-w-0 flex-1 basis-44 text-xs text-text-muted">{t("serverSettings.sessions.logoutHint")}</p><Button variant="secondary" size="sm" disabled={busy} onClick={() => { settings.clearFeedback(); setConfirmation({ type: "logout" }); }}><LogOut className="size-3.5" aria-hidden />{t("serverSettings.sessions.logout")}</Button></div>
    </SettingsGroup>

    <SettingsDialog open={panel !== null} onClose={closePanel} canClose={!busy && (!hasRecoveryCodes || acknowledged)} title={t(hasRecoveryCodes ? "serverSettings.twoFactor.recoveryTitle" : panel === "password" ? "serverSettings.password.change" : panel === "disable" ? "serverSettings.twoFactor.disableTitle" : "serverSettings.twoFactor.setupTitle")} description={t(hasRecoveryCodes ? "serverSettings.twoFactor.recoveryHint" : panel === "password" ? "serverSettings.password.dialogHint" : panel === "disable" ? "serverSettings.twoFactor.disableHint" : secret ? "serverSettings.twoFactor.secretHint" : "serverSettings.twoFactor.setupHint")}>
      <SettingsFeedback error={formError ?? settings.error} success={copyStatus} />
      {hasRecoveryCodes ? <>
        <textarea aria-label={t("serverSettings.twoFactor.recoveryCodes")} readOnly rows={Math.min(recoveryCodes.length, 10)} value={recoveryCodes.join("\n")} onFocus={(event) => event.target.select()} className="w-full resize-none rounded-md border border-line-strong bg-surface-subtle p-4 font-mono text-sm leading-relaxed text-text" />
        <div className="flex flex-wrap gap-3"><Button variant="secondary" size="sm" onClick={() => void copy(recoveryCodes.join("\n"))}><Copy className="size-3.5" aria-hidden />{t("serverSettings.copy")}</Button><Button variant="secondary" size="sm" onClick={downloadRecoveryCodes}><Download className="size-3.5" aria-hidden />{t("serverSettings.download")}</Button></div>
        <Checkbox id="settings-recovery-saved" checked={acknowledged} onCheckedChange={setAcknowledged} label={t("serverSettings.twoFactor.acknowledge")} />
        <div className="flex justify-end"><Button disabled={!acknowledged} onClick={closePanel}>{t("serverSettings.done")}</Button></div>
      </> : <form onSubmit={(event) => void saveSecurity(event)} className="space-y-4">
        {(!secret || panel !== "enable") && <Input label={t("serverSettings.password.current")} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength={128} disabled={busy} autoFocus />}
        {panel === "password" && <><Input label={t("serverSettings.password.new")} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={15} maxLength={128} hint={t("serverSettings.password.requirements")} disabled={busy} /><Input label={t("serverSettings.password.confirm")} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={15} maxLength={128} disabled={busy} /></>}
        {panel === "enable" && secret && <div className="space-y-3"><Input label={t("serverSettings.twoFactor.secret")} value={secret} readOnly autoComplete="off" onFocus={(event) => event.target.select()} className="font-mono" /><Button type="button" variant="secondary" size="sm" onClick={() => void copy(secret)}><Copy className="size-3.5" aria-hidden />{t("serverSettings.copy")}</Button><p className="text-xs leading-relaxed text-text-muted">{t("serverSettings.twoFactor.appSettings", { email: account.user.email })}</p></div>}
        {(panel === "disable" || (panel === "password" && account.twoFactorEnabled) || (panel === "enable" && secret)) && <Input label={t(panel === "enable" ? "serverSettings.twoFactor.code" : "serverSettings.twoFactor.codeOrRecovery")} type="text" autoComplete="one-time-code" inputMode={panel === "enable" ? "numeric" : "text"} pattern={panel === "enable" ? "[0-9]{6}" : undefined} value={code} onChange={(event) => setCode(event.target.value)} required minLength={6} maxLength={32} disabled={busy} />}
        <div className="flex flex-wrap justify-end gap-3 pt-2"><Button type="button" variant="secondary" disabled={busy} onClick={closePanel}>{t("serverSettings.cancel")}</Button><Button type="submit" variant={panel === "disable" ? "danger" : "primary"} loading={busy}>{t(panel === "password" ? "serverSettings.password.change" : panel === "disable" ? "serverSettings.twoFactor.disable" : secret ? "serverSettings.twoFactor.confirm" : "serverSettings.twoFactor.continue")}</Button></div>
      </form>}
    </SettingsDialog>

    <SettingsDialog open={confirmation !== null} onClose={() => setConfirmation(null)} canClose={!busy && !loggingOut} title={confirmationTitle} description={confirmationDescription}>
      <SettingsFeedback error={settings.error} />
      <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={busy || loggingOut} onClick={() => setConfirmation(null)}>{t("serverSettings.cancel")}</Button><Button variant="danger" loading={busy || loggingOut} onClick={() => void confirmSessionAction()}>{t(confirmation?.type === "logout" ? "serverSettings.sessions.logout" : "serverSettings.sessions.confirmRevoke")}</Button></div>
    </SettingsDialog>
  </div>;
}
