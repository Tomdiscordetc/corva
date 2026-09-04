import { createBrowserRouter } from "react-router-dom";
import { RootRedirect } from "./routes/RootRedirect";
import { SplashScreen } from "./routes/auth/SplashScreen";
import { LoginPage } from "./routes/auth/LoginPage";
import { AppShell } from "./components/shell/AppShell";
import { DashboardPage } from "./routes/dashboard/DashboardPage";
import { StyleguidePage } from "./routes/styleguide/StyleguidePage";
import { ComingSoonPage } from "./routes/ComingSoonPage";
import { t } from "./i18n";

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/splash", element: <SplashScreen /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "contacts", element: <ComingSoonPage title={t("nav.contacts")} /> },
      { path: "inbox", element: <ComingSoonPage title={t("nav.inbox")} /> },
      { path: "calendar", element: <ComingSoonPage title={t("nav.calendar")} /> },
      { path: "tasks", element: <ComingSoonPage title={t("nav.tasks")} /> },
      { path: "reports", element: <ComingSoonPage title={t("nav.reports")} /> },
      { path: "settings", element: <ComingSoonPage title={t("nav.settings")} /> },
      { path: "styleguide", element: <StyleguidePage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });
