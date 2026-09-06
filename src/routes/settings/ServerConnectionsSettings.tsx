import { CheckCircle2, Link2, Loader2, Mail, MessageCircle, Phone, RefreshCw, Server, type LucideIcon } from "lucide-react";
import { useServerConnections } from "@/hooks/useAccountSettings";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { t } from "@/i18n";
import { SettingsFeedback } from "./SettingsGroup";

const ICONS: Record<string, LucideIcon> = { email: Mail, phone: Phone, whatsapp: MessageCircle, social: Link2 };

export function ServerConnectionsSettings() {
  const connections = useServerConnections();
  const email = useAuthStore((state) => state.user?.email ?? "");

  return <div className="space-y-5">
    <div className="flex items-start gap-3 rounded-md border border-accent/15 bg-accent-tint px-4 py-3 text-xs leading-relaxed text-accent-text"><Server className="mt-0.5 size-4 shrink-0" aria-hidden /><p>{t("serverSettings.connections.notice")}</p></div>
    <SettingsFeedback error={connections.error} success={connections.sent ? t("serverSettings.connections.testSent", { email }) : null} />
    <div className="flex justify-end"><Button variant="secondary" size="sm" loading={connections.loading} disabled={connections.busy} onClick={() => void connections.reload()}><RefreshCw className="size-3.5" aria-hidden />{t(connections.error && !connections.data ? "serverSettings.retry" : "serverSettings.refresh")}</Button></div>
    {connections.loading && !connections.data && <p role="status" className="flex items-center gap-2 py-4 text-xs text-text-muted"><Loader2 className="size-4 animate-spin" aria-hidden />{t("serverSettings.loading")}</p>}
    {connections.data && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{connections.data.connections.map((connection) => {
      const Icon = ICONS[connection.id] ?? Link2;
      const configured = connection.status === "configured";
      return <Card key={connection.id} className="flex min-w-0 flex-col p-5 shadow-none sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface-subtle text-text"><Icon className="size-5" aria-hidden /></div><span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-subtle px-2.5 py-1 text-2xs text-text-muted">{configured && <CheckCircle2 className="size-3.5 shrink-0 text-positive" aria-hidden />}{t(configured ? "serverSettings.connections.configured" : "serverSettings.connections.notConfigured")}</span></div><h3 className="text-sm font-semibold text-text">{t(`settings.connections.${connection.id}`)}</h3><p className="mt-2 break-words text-xs leading-relaxed text-text-muted">{connection.message}</p>{connection.id === "email" && <div className="mt-auto space-y-3 pt-5"><p className="text-2xs leading-relaxed text-text-muted">{t("serverSettings.connections.emailScope")}</p><Button variant="secondary" size="sm" loading={connections.busy} disabled={!connections.data?.emailAvailable || connections.loading} onClick={() => void connections.sendTest()}><Mail className="size-3.5" aria-hidden />{t("serverSettings.connections.sendTest")}</Button><p className="break-all text-2xs text-text-muted">{t("serverSettings.connections.recipient", { email })}</p></div>}</Card>;
    })}</div>}
    <p className="text-xs leading-relaxed text-text-muted">{t("serverSettings.connections.adminHint")}</p>
  </div>;
}
