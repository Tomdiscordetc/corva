import { create } from "zustand";
import type { AuthState, AuthUser, AuthStep } from "./authTypes";

/**
 * Schritte des Anmeldeablaufs. `identify` → `password` sind der Normalfall,
 * `twoFactor` und `setPassword` schalten sich je nach Konto dazu, `recover`
 * ist der Seitenzweig „Passwort vergessen".
 */
/** Demo-Werte, solange kein Server dahinter steht (REGELN.md Punkt 5). */
export const DEMO_TWO_FACTOR_CODE = "123456";
export const DEMO_INITIAL_PASSWORD = "start1234";

const SESSION_KEY = "corva.session";
const TRUSTED_KEY = "corva.trustedDevice";
const RESEND_SECONDS = 30;

function readStoredSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Speicher gesperrt (privates Fenster) — Anmeldung gilt dann nur für diese Sitzung. */
  }
}

function isTrustedDevice(email: string) {
  try {
    const raw = localStorage.getItem(TRUSTED_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(email.toLowerCase()) : false;
  } catch {
    return false;
  }
}

function rememberTrustedDevice(email: string) {
  try {
    const raw = localStorage.getItem(TRUSTED_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(email.toLowerCase())) list.push(email.toLowerCase());
    localStorage.setItem(TRUSTED_KEY, JSON.stringify(list));
  } catch {
    /* siehe oben */
  }
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0]?.replace(/[._]/g, " ") ?? "Team-Mitglied";
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulierte Anmeldung für die Design-Abschnitte. Es gibt noch keinen Server:
 * jede E-Mail mit einem Passwort ab 4 Zeichen wird angenommen. Zwei Sonderfälle
 * bilden die echten Abläufe ab, damit sie gestaltet und geprüft werden können:
 * `start1234` verlangt ein neues Passwort, ein unbekanntes Gerät verlangt den
 * Bestätigungscode. Wird in Abschnitt 3 gegen die echte Anmeldung getauscht,
 * ohne dass die Oberfläche angefasst werden muss.
 */
export const createDemoAuthStore = () => create<AuthState>()((set, get) => {
  const restored = typeof localStorage === "undefined" ? null : readStoredSession();

  function completeLogin(email: string) {
    const user: AuthUser = { name: displayNameFromEmail(email), email, role: "admin" };
    if (get().rememberMe) writeStoredSession(user);
    set({ status: "signed-in", user, error: null, busy: false, freshLogin: true });
  }

  return {
    status: restored ? "signed-in" : "signed-out",
    step: "identify",
    direction: 1,
    email: "",
    rememberMe: true,
    resendIn: 0,
    busy: false,
    user: restored,
    previewRole: null,
    error: null,
    notice: null,
    checked: true,
    checking: false,
    checkError: null,
    freshLogin: false,
    resetToken: null,
    async bootstrap() {},
    expireSession() { get().logout(); },
    beginReset() {},
    updateUser(user) { set({ user }); },

    async submitEmail(email) {
      const trimmed = email.trim();
      if (!trimmed.includes("@") || trimmed.length < 5) {
        set({ error: "Bitte gib eine gültige E-Mail-Adresse ein." });
        return;
      }
      set({ busy: true, error: null });
      await wait(450);
      set({ email: trimmed, step: "password", direction: 1, busy: false });
    },

    async submitPassword(password) {
      if (password.length < 4) {
        set({ error: "E-Mail oder Passwort ist falsch." });
        return;
      }
      const { email } = get();
      set({ status: "authenticating", error: null, busy: true });
      await wait(1400);

      if (password === DEMO_INITIAL_PASSWORD) {
        set({ status: "signed-out", step: "setPassword", direction: 1, busy: false });
        return;
      }
      if (!isTrustedDevice(email)) {
        set({ status: "signed-out", step: "twoFactor", direction: 1, busy: false, resendIn: RESEND_SECONDS });
        return;
      }
      completeLogin(email);
    },

    async submitTwoFactor(code, trustDevice) {
      if (code.length !== 6) {
        set({ error: "Bitte gib den sechsstelligen Code ein." });
        return;
      }
      set({ status: "authenticating", error: null, busy: true });
      await wait(1100);

      if (code !== DEMO_TWO_FACTOR_CODE) {
        set({ status: "signed-out", busy: false, error: "Der Code stimmt nicht. Bitte prüfe die Ziffern." });
        return;
      }
      const { email } = get();
      if (trustDevice) rememberTrustedDevice(email);
      completeLogin(email);
    },

    async submitNewPassword(password) {
      if (password.length < 10) {
        set({ error: "Das Passwort erfüllt noch nicht alle Anforderungen." });
        return;
      }
      set({ busy: true, error: null });
      await wait(900);
      const { email } = get();
      if (!isTrustedDevice(email)) {
        set({ step: "twoFactor", direction: 1, busy: false, resendIn: RESEND_SECONDS });
        return;
      }
      set({ status: "authenticating" });
      await wait(600);
      completeLogin(email);
    },

    async requestRecovery(email) {
      const trimmed = email.trim();
      if (!trimmed.includes("@")) {
        set({ error: "Bitte gib eine gültige E-Mail-Adresse ein." });
        return;
      }
      set({ busy: true, error: null });
      await wait(900);
      set({ email: trimmed, step: "recoverSent", direction: 1, busy: false });
    },

    async resendCode() {
      if (get().resendIn > 0) return;
      set({ busy: true, error: null });
      await wait(600);
      set({ busy: false, resendIn: RESEND_SECONDS });
    },

    tickResend() {
      const { resendIn } = get();
      if (resendIn > 0) set({ resendIn: resendIn - 1 });
    },

    goToStep(step) {
      const order: AuthStep[] = ["identify", "password", "twoFactor", "setPassword", "recover", "recoverSent"];
      const direction = order.indexOf(step) >= order.indexOf(get().step) ? 1 : -1;
      set({ step, direction, error: null });
    },

    back() {
      const { step } = get();
      const target: AuthStep = step === "recoverSent" ? "recover" : step === "recover" ? "password" : "identify";
      set({ step: target, direction: -1, error: null });
    },

    setRememberMe(rememberMe) {
      set({ rememberMe });
    },

    clearError() {
      set({ error: null });
    },

    logout() {
      writeStoredSession(null);
      set({
        status: "signed-out",
        step: "identify",
        direction: -1,
        user: null,
        previewRole: null,
        error: null,
        email: "",
        resendIn: 0,
        busy: false,
      });
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
  };
});
