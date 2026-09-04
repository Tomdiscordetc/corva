import { create } from "zustand";

export type Role = "inhaber" | "admin" | "teamleiter" | "mitarbeiter";

export const ROLE_LABELS: Record<Role, string> = {
  inhaber: "Inhaber",
  admin: "Admin",
  teamleiter: "Teamleiter",
  mitarbeiter: "Mitarbeiter",
};

interface AuthUser {
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  status: "signed-out" | "authenticating" | "signed-in";
  user: AuthUser | null;
  /** Für die Admin-Vorschau „Ansicht als" — ändert keine echten Rechte. */
  previewRole: Role | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  clearError: () => void;
  logout: () => void;
  setPreviewRole: (role: Role | null) => void;
  effectiveRole: () => Role | null;
}

/**
 * Simulierte Anmeldung für Abschnitt 1 (Design). Es gibt noch keinen Server —
 * jede E-Mail mit einem Passwort ab 4 Zeichen meldet an, sonst kommt ein
 * Fehlerzustand. Wird in Abschnitt 3 gegen die echte Anmeldung getauscht,
 * ohne dass die Oberfläche angefasst werden muss.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  status: "signed-out",
  user: null,
  previewRole: null,
  error: null,
  async login(email, password) {
    set({ status: "authenticating", error: null });
    await new Promise((r) => setTimeout(r, 1500));
    if (!email.includes("@") || password.length < 4) {
      set({ status: "signed-out", error: "E-Mail oder Passwort ist falsch." });
      return;
    }
    const name = email.split("@")[0]?.replace(/[._]/g, " ") ?? "Team-Mitglied";
    set({
      status: "signed-in",
      user: {
        name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role: "admin",
      },
      error: null,
    });
  },
  clearError() {
    set({ error: null });
  },
  logout() {
    set({ status: "signed-out", user: null, previewRole: null, error: null });
  },
  setPreviewRole(role) {
    set({ previewRole: role });
  },
  effectiveRole() {
    const { user, previewRole } = get();
    if (!user) return null;
    if (user.role === "admin" || user.role === "inhaber") {
      return previewRole ?? user.role;
    }
    return user.role;
  },
}));
