import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ContextPanel } from "./ContextPanel";
import { Topbar } from "./Topbar";
import { ShortcutsHelpDialog } from "./ShortcutsHelpDialog";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useAuthStore } from "@/store/auth";
import { useCommandPaletteShortcut } from "@/hooks/useCommandPaletteShortcut";
import { useNavShortcuts } from "@/hooks/useNavShortcuts";

export function AppShell() {
  const status = useAuthStore((s) => s.status);
  useCommandPaletteShortcut();
  useNavShortcuts();

  if (status !== "signed-in") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-dvh w-full bg-surface-sunken">
      <Sidebar />
      <ContextPanel />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="app-main flex-1 overflow-y-auto px-6 py-6 max-lg:pb-24 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <ShortcutsHelpDialog />
    </div>
  );
}
