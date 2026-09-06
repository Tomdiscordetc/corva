import { useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useServerNotifications, type NotificationCategory } from "@/hooks/useServerNotifications";
import { t } from "@/i18n";

export function NotificationTest() {
  const notifications = useServerNotifications();
  const [category, setCategory] = useState<NotificationCategory>("inquiries");
  const [result, setResult] = useState("");
  async function send() {
    setResult("");
    try { await notifications.sendTest(category); setResult(t("serverPreferences.testCreated")); }
    catch { /* Der Hook zeigt die konkrete Servermeldung an. */ }
  }
  return <div className="space-y-4 rounded-lg border border-line bg-surface-raised p-5 sm:p-6">
    <div><h3 className="text-sm font-semibold text-text">{t("serverPreferences.testTitle")}</h3><p className="mt-1 text-xs leading-relaxed text-text-muted">{t("serverPreferences.testHint")}</p></div>
    <div className="flex flex-wrap items-end gap-3"><label className="flex min-w-0 flex-1 flex-col gap-2 text-xs text-text-muted">{t("serverPreferences.testCategory")}<select value={category} onChange={(e) => setCategory(e.target.value as NotificationCategory)} disabled={notifications.busy} className="h-11 rounded-md border border-line-strong bg-surface px-3 text-sm text-text">{(["inquiries", "assignments", "appointments", "summary"] as const).map((key) => <option key={key} value={key}>{t(`settings.notifications.${key}`)}</option>)}</select></label><Button variant="secondary" loading={notifications.busy} onClick={() => { void send(); }}><BellRing className="size-4" aria-hidden />{t("serverPreferences.testSend")}</Button></div>
    {result && <p role="status" className="text-xs text-positive">{result}</p>}
    {notifications.actionError && <p role="alert" className="text-xs text-danger">{notifications.actionError}</p>}
  </div>;
}
