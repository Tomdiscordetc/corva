import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Inbox, Calendar, ListTodo, BarChart3, Settings, LogOut } from "lucide-react";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { t } from "@/i18n";

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function go(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label={t("commandPalette.placeholder")}
      overlayClassName="fixed inset-0 z-50 bg-neutral-1000/40 animate-[overlay-in_var(--t-base)_var(--ease-standard)]"
      contentClassName="fixed top-[18vh] left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-surface-raised shadow-[var(--shadow-overlay)] animate-[dialog-in_var(--t-base)_var(--ease-standard)]"
    >
      <Command.Input
        placeholder={t("commandPalette.placeholder")}
        className="w-full border-b border-line px-4 py-3.5 text-sm text-text outline-none placeholder:text-text-faint"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
          {t("commandPalette.empty")}
        </Command.Empty>
        <Command.Group heading={t("commandPalette.groupNav")} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-faint">
          <Item icon={<LayoutDashboard className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.dashboard")}
          </Item>
          <Item icon={<Users className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.contacts")}
          </Item>
          <Item icon={<Inbox className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.inbox")}
          </Item>
          <Item icon={<Calendar className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.calendar")}
          </Item>
          <Item icon={<ListTodo className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.tasks")}
          </Item>
          <Item icon={<BarChart3 className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.reports")}
          </Item>
          <Item icon={<Settings className="size-4" />} onSelect={() => go("/app")}>
            {t("nav.settings")}
          </Item>
        </Command.Group>
        <Command.Group heading={t("commandPalette.groupActions")} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-faint">
          <Item icon={<LogOut className="size-4" />} onSelect={() => { logout(); setOpen(false); }}>
            {t("topbar.logout")}
          </Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

function Item({ icon, children, onSelect }: { icon: React.ReactNode; children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2.5 text-sm text-text data-[selected=true]:bg-neutral-100"
    >
      <span className="text-text-faint">{icon}</span>
      {children}
    </Command.Item>
  );
}
