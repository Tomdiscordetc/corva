import { createBrowserRouter } from "react-router-dom";
import { RootRedirect } from "./routes/RootRedirect";
import { SplashScreen } from "./routes/auth/SplashScreen";
import { LoginPage } from "./routes/auth/LoginPage";
import { AppShell } from "./components/shell/AppShell";
import { DashboardPage } from "./routes/dashboard/DashboardPage";
import { StyleguidePage } from "./routes/styleguide/StyleguidePage";
import { SettingsPage } from "./routes/settings/SettingsPage";
import { TasksPage } from "./routes/tasks/TasksPage";
import { ContactsPage } from "./routes/contacts/ContactsPage";
import { ContactDetailPage } from "./routes/contacts/ContactDetailPage";
import { ImprintPage, PrivacyPage } from "./routes/legal/LegalPage";
import { ComingSoonPage } from "./routes/ComingSoonPage";
import { t } from "./i18n";

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/splash", element: <SplashScreen /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/impressum", element: <ImprintPage /> },
  { path: "/datenschutz", element: <PrivacyPage /> },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "contacts/:contactId", element: <ContactDetailPage /> },
      { path: "inbox", element: <ComingSoonPage title={t("nav.inbox")} /> },
      { path: "calendar", element: <ComingSoonPage title={t("nav.calendar")} /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "reports", element: <ComingSoonPage title={t("nav.reports")} /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "styleguide", element: <StyleguidePage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });
