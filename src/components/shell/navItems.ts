import type { ComponentType } from "react";
import { LayoutDashboard, Users, Inbox, Calendar, ListTodo, BarChart3, Settings } from "lucide-react";
import { t } from "@/i18n";

export interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function getNavItems(): NavItem[] {
  return [
    { path: "/app", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/app/contacts", label: t("nav.contacts"), icon: Users },
    { path: "/app/inbox", label: t("nav.inbox"), icon: Inbox },
    { path: "/app/calendar", label: t("nav.calendar"), icon: Calendar },
    { path: "/app/tasks", label: t("nav.tasks"), icon: ListTodo },
    { path: "/app/reports", label: t("nav.reports"), icon: BarChart3 },
    { path: "/app/settings", label: t("nav.settings"), icon: Settings },
  ];
}
