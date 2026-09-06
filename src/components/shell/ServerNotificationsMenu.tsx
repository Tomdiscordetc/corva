import { Bell, Check, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useServerNotifications } from "@/hooks/useServerNotifications";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { t } from "@/i18n";

export function ServerNotificationsMenu() {
  const notifications = useServerNotifications();
  const navigate = useNavigate();
  const count = notifications.data?.unreadCount ?? 0;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button aria-label={count ? t("serverPreferences.unreadLabel", { count }) : t("topbar.notifications")} className="relative flex size-9 items-center justify-center rounded-md text-text-muted transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text">
        <Bell className="size-4.5" aria-hidden />
        {count > 0 && <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-80 max-w-[calc(100vw-2rem)]">
      <DropdownMenuLabel>{t("topbar.notifications")}</DropdownMenuLabel>
      {notifications.isPending && <p role="status" className="px-3 py-4 text-xs text-text-muted">{t("serverPreferences.loading")}</p>}
      {(notifications.error || notifications.actionError) && <p role="alert" className="px-3 py-2 text-xs text-danger">{notifications.error?.message ?? notifications.actionError}</p>}
      {notifications.isError && <DropdownMenuItem onSelect={() => { void notifications.refetch(); }}>{t("serverPreferences.retry")}</DropdownMenuItem>}
      {!notifications.isPending && !notifications.isError && !notifications.data?.items.length && <p className="px-3 py-4 text-xs text-text-muted">{t("serverPreferences.noNotifications")}</p>}
      <div className="max-h-80 overflow-y-auto">
        {notifications.data?.items.map((item) => <DropdownMenuItem key={item.id} disabled={notifications.busy || !!item.readAt} onSelect={() => notifications.markRead(item.id)}>
          <div className="min-w-0 flex-1 py-1"><p className="break-words text-xs font-medium">{item.title}</p><p className="mt-1 break-words text-2xs leading-relaxed text-text-muted">{item.body}</p><p className="mt-2 text-2xs text-text-faint">{item.readAt ? t("serverPreferences.read") : t("serverPreferences.markRead")}</p></div>
          {item.readAt && <Check className="size-3.5 shrink-0 text-text-faint" aria-hidden />}
        </DropdownMenuItem>)}
      </div>
      {count > 0 && <><DropdownMenuSeparator /><DropdownMenuItem disabled={notifications.busy} onSelect={notifications.markAllRead}><Check className="size-3.5" aria-hidden />{t("serverPreferences.readAll")}</DropdownMenuItem></>}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => navigate("/app/settings?section=notifications")}><Settings className="size-3.5" aria-hidden />{t("settings.title")}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
