import { Search, Bell, LogOut, Eye, Monitor, Sun, Moon } from "lucide-react";
import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useUiStore, type Density } from "@/store/ui";
import { useAuthStore, ROLE_LABELS, type Role } from "@/store/auth";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { Avatar } from "@/components/ui/Avatar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { ContextPanelOpenButton } from "./ContextPanel";
import { t } from "@/i18n";

const PREVIEW_ROLES: Role[] = ["admin", "teamleiter", "mitarbeiter"];
const THEME_OPTIONS: { value: ThemeChoice; icon: typeof Monitor; labelKey: string }[] = [
  { value: "system", icon: Monitor, labelKey: "topbar.themeSystem" },
  { value: "light", icon: Sun, labelKey: "topbar.themeLight" },
  { value: "dark", icon: Moon, labelKey: "topbar.themeDark" },
];

export function Topbar() {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const user = useAuthStore((s) => s.user);
  const previewRole = useAuthStore((s) => s.previewRole);
  const setPreviewRole = useAuthStore((s) => s.setPreviewRole);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isFetching = useIsFetching() > 0;

  if (!user) return null;

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
      <ContextPanelOpenButton />
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex h-9 w-full max-w-80 items-center gap-2 rounded-md border border-line-strong bg-surface-sunken px-3 text-sm text-text-faint transition-colors duration-[var(--t-fast)] hover:border-line-strong hover:bg-surface-hover"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">{t("topbar.search")}</span>
        <AnimatePresence>
          {isFetching && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent"
            />
          )}
        </AnimatePresence>
        <kbd className="rounded-[6px] border border-line-strong bg-surface px-1.5 py-0.5 text-2xs text-text-faint max-sm:hidden">
          Strg K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <SegmentedControl
          aria-label={t("topbar.density")}
          value={density}
          onChange={(v: Density) => setDensity(v)}
          className="max-md:hidden"
          options={[
            { value: "comfortable", label: t("topbar.densityComfortable") },
            { value: "compact", label: t("topbar.densityCompact") },
          ]}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={t("topbar.notifications")}
              className="relative flex size-9 items-center justify-center rounded-md text-text-muted transition-colors duration-[var(--t-fast)] hover:bg-surface-hover hover:text-text"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72">
            <DropdownMenuLabel>{t("topbar.notifications")}</DropdownMenuLabel>
            <DropdownMenuItem>Neue Anfrage von Laura Fischer (Instagram)</DropdownMenuItem>
            <DropdownMenuItem>Termin in 30 Minuten: Mehmet Aydın</DropdownMenuItem>
            <DropdownMenuItem>Angebot von Kevin Brandt noch offen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md py-1 pr-2 pl-1 transition-colors duration-[var(--t-fast)] hover:bg-surface-hover">
              <Avatar name={user.name} size="sm" />
              <span className="max-w-32 truncate text-sm font-medium text-text max-md:hidden">
                {user.name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{ROLE_LABELS[user.role]} · {user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-3" /> {t("topbar.viewAs")}
              </span>
            </DropdownMenuLabel>
            {PREVIEW_ROLES.map((role) => (
              <DropdownMenuItem
                key={role}
                onSelect={() => setPreviewRole(previewRole === role ? null : role)}
              >
                {previewRole === role ? "✓ " : ""}
                {ROLE_LABELS[role]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("topbar.theme")}</DropdownMenuLabel>
            {THEME_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onSelect={() => setTheme(opt.value)}>
                <opt.icon className="size-3.5" />
                {t(opt.labelKey)}
                {theme === opt.value ? " ✓" : ""}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut className="size-3.5" /> {t("topbar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
