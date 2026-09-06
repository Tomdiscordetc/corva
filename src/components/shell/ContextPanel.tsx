import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUiStore } from "@/store/ui";
import { Avatar } from "@/components/ui/Avatar";
import { PresenceAvatar, PresenceDot } from "@/components/ui/PresenceDot";
import { presenceFromLabel } from "@/lib/presence";
import { usePresenceStore } from "@/store/presence";
import { getNavItems } from "./navItems";
import { t } from "@/i18n";
import { SettingsNavigation } from "@/routes/settings/SettingsNavigation";
import { SERVER_MODE } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { useAuthStore } from "@/store/auth";

function usePanelControls() {
  const open = useUiStore((s) => s.contextPanelOpen);
  const toggle = useUiStore((s) => s.toggleContextPanel);
  const email = useAuthStore((s) => s.user?.email ?? "");
  const settings = useSettings(email);
  return { open, disabled: settings.busy || settings.loading || !!settings.loadError, toggle: () => { if (SERVER_MODE) void settings.changeContextPanel(!open); else toggle(); } };
}

const TEAM = [
  { name: "Sabine Krüger", status: "aktiv" },
  { name: "Mehmet Aydın", status: "im Termin" },
  { name: "Julia Bergmann", status: "aktiv" },
  { name: "Thomas Nowak", status: "abwesend" },
];

export function ContextPanel() {
  const { open, toggle, disabled } = usePanelControls();
  const { pathname } = useLocation();
  const ownName = useAuthStore((s) => s.user?.name);
  const ownStatus = usePresenceStore((s) => s.status);
  const current = getNavItems().find((i) => (i.path === "/app" ? pathname === "/app" : pathname.startsWith(i.path)));

  return (
    <motion.aside
      inert={!open}
      aria-hidden={!open}
      animate={{ width: open ? 264 : 0 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      className="shrink-0 overflow-hidden border-r border-line bg-surface-sunken max-md:hidden"
    >
      <div className="flex h-full w-[264px] flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-sm font-semibold text-text">{current?.label ?? ""}</h2>
          <button
            onClick={toggle}
            disabled={disabled}
            aria-label="Seitenbereich einklappen"
            className="flex size-7 items-center justify-center rounded-full text-text-faint transition-colors duration-[var(--t-fast)] hover:bg-surface-press hover:text-text"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <AnimatePresence mode="wait">
            {pathname.startsWith("/app/settings") ? (
              <div key="settings"><SettingsNavigation inContextPanel /></div>
            ) : pathname === "/app" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <p className="mb-2 text-2xs font-medium text-text-faint">Team</p>
                  <ul className="space-y-1">
                    {TEAM.map((member) => {
                      // Der eigene Eintrag folgt dem selbst gesetzten Status,
                      // die übrigen dem, was aus Kalender und Telefonie kommt.
                      const isSelf = member.name === ownName;
                      const status = isSelf ? ownStatus : presenceFromLabel(member.status);
                      return (
                        <li
                          key={member.name}
                          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-[var(--t-fast)] hover:bg-surface-hover"
                        >
                          <PresenceAvatar status={status}>
                            <Avatar name={member.name} size="sm" />
                          </PresenceAvatar>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-text">{member.name}</p>
                            <p className="flex items-center gap-1.5 truncate text-2xs text-text-faint">
                              <PresenceDot status={status} />
                              {isSelf ? t(`presence.short${status[0]!.toUpperCase()}${status.slice(1)}`) : member.status}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="generic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-text-faint"
              >
                {t("dashboard.demoNotice")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

export function ContextPanelOpenButton() {
  const { open, toggle, disabled } = usePanelControls();
  if (open) return null;
  return (
    <button
      onClick={toggle}
      disabled={disabled}
      aria-label="Seitenbereich einblenden"
      className="flex size-8 items-center justify-center rounded-md text-text-faint transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text max-md:hidden"
    >
      <PanelLeftOpen className="size-4" />
    </button>
  );
}
