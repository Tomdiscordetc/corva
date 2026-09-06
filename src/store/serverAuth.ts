import { create } from "zustand";
import { api, initCsrf, resetCsrf } from "@/lib/api";
import { t } from "@/i18n";
import type { AuthState, AuthUser } from "./authTypes";

type Session = { user: AuthUser | null; csrfToken: string };
type LoginResponse = { user: AuthUser } | { requiresTwoFactor: true; challengeId: string };
const message = (error: unknown) => error instanceof Error ? error.message : t("serverAuth.unavailable");

/** Session identity exists in memory only; authentication belongs to HttpOnly cookies. */
export const createServerAuthStore = () => create<AuthState>()((set, get) => {
  let challengeId: string | null = null;
  let generation = 0;
  let pendingBootstrap: Promise<void> | null = null;

  const completeLogin = (user: AuthUser) => {
    generation += 1;
    challengeId = null;
    set({ user, status: "signed-in", checked: true, checking: false, checkError: null, busy: false, error: null, notice: null, freshLogin: true });
  };
  const signedOut = () => ({ status: "signed-out" as const, user: null, previewRole: null, busy: false, freshLogin: false });

  return {
    ...signedOut(), step: "identify", direction: 1, email: "", rememberMe: true,
    resendIn: 0, error: null, notice: null, checked: false, checking: false,
    checkError: null, resetToken: null,

    bootstrap() {
      if (pendingBootstrap) return pendingBootstrap;
      const requestGeneration = generation;
      set({ checking: true, checkError: null });
      pendingBootstrap = (async () => {
        try {
          const session = await api<Session>("/auth/session");
          if (requestGeneration !== generation) return;
          initCsrf(session.csrfToken);
          if (get().resetToken) {
            set({ checked: true, checking: false });
            return;
          }
          const wasSignedIn = get().status === "signed-in";
          set({
            user: session.user, status: session.user ? "signed-in" : "signed-out",
            checked: true, checking: false, checkError: null, freshLogin: false,
            ...(wasSignedIn && !session.user ? { step: "identify", error: t("serverAuth.expired") } : {}),
          });
        } catch (error) {
          if (requestGeneration === generation) set({ checked: false, checking: false, checkError: message(error) });
        }
      })().finally(() => { pendingBootstrap = null; });
      return pendingBootstrap;
    },
    expireSession() {
      generation += 1;
      challengeId = null;
      resetCsrf();
      set({ ...signedOut(), checked: true, checking: false, checkError: null, step: "identify", resetToken: null, error: t("serverAuth.expired") });
    },
    beginReset(token) {
      generation += 1;
      challengeId = null;
      set({ ...signedOut(), checked: true, checking: false, checkError: null, step: "setPassword", resetToken: token, error: null, notice: null });
    },
    updateUser(user) { set({ user }); },
    async submitEmail(email) {
      const trimmed = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { set({ error: t("serverAuth.invalidEmail") }); return; }
      challengeId = null;
      set({ email: trimmed, step: "password", direction: 1, error: null, notice: null });
    },
    async submitPassword(password) {
      if (get().busy) return;
      if (!password) { set({ error: t("serverAuth.invalidCredentials") }); return; }
      generation += 1;
      const requestGeneration = generation;
      set({ status: "authenticating", busy: true, error: null, notice: null });
      try {
        const result = await api<LoginResponse>("/auth/login", { method: "POST", body: { email: get().email, password, rememberMe: get().rememberMe } });
        if (requestGeneration !== generation) return;
        if ("requiresTwoFactor" in result) {
          challengeId = result.challengeId;
          set({ status: "signed-out", step: "twoFactor", direction: 1, busy: false });
        } else completeLogin(result.user);
      } catch (error) {
        if (requestGeneration === generation) set({ status: "signed-out", busy: false, error: message(error) });
      }
    },
    async submitTwoFactor(code) {
      if (get().busy) return;
      if (!challengeId) { set({ step: "password", error: t("serverAuth.challengeExpired") }); return; }
      if (!code.trim()) { set({ error: t("serverAuth.codeRequired") }); return; }
      const requestGeneration = ++generation;
      set({ status: "authenticating", busy: true, error: null });
      try {
        const { user } = await api<{ user: AuthUser }>("/auth/totp", { method: "POST", body: { challengeId, code: code.trim() } });
        if (requestGeneration === generation) completeLogin(user);
      } catch (error) {
        if (requestGeneration === generation) set({ status: "signed-out", busy: false, error: message(error) });
      }
    },
    async submitNewPassword(password, code) {
      if (get().busy) return;
      const token = get().resetToken;
      if (!token) { set({ error: t("serverAuth.resetMissing") }); return; }
      set({ busy: true, error: null });
      try {
        await api("/auth/reset", { method: "POST", body: { token, password, ...(code?.trim() ? { code: code.trim() } : {}) } });
        resetCsrf();
        set({ ...signedOut(), resetToken: null, step: "identify", direction: -1, error: null, notice: t("serverAuth.resetComplete") });
      } catch (error) { set({ busy: false, error: message(error) }); }
    },
    async requestRecovery(email) {
      if (get().busy) return;
      const trimmed = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { set({ error: t("serverAuth.invalidEmail") }); return; }
      set({ busy: true, error: null });
      try {
        await api("/auth/recovery", { method: "POST", body: { email: trimmed } });
        set({ email: trimmed, step: "recoverSent", direction: 1, busy: false });
      } catch (error) { set({ busy: false, error: message(error) }); }
    },
    async resendCode() {},
    tickResend() {},
    goToStep(step) {
      if (get().busy) return;
      challengeId = null;
      set({ step, direction: 1, error: null, notice: null, resetToken: null });
    },
    back() {
      if (get().busy) return;
      challengeId = null;
      set({ step: "identify", direction: -1, error: null, notice: null, resetToken: null });
    },
    setRememberMe(rememberMe) { set({ rememberMe }); },
    clearError() { set({ error: null }); },
    async logout() {
      if (get().busy) return;
      set({ busy: true, error: null });
      try {
        await api("/auth/logout", { method: "POST" });
        generation += 1;
        challengeId = null;
        resetCsrf();
        set({ ...signedOut(), checked: true, checking: false, step: "identify", direction: -1, email: "", resetToken: null, error: null, notice: null });
      } catch (error) { set({ busy: false, error: message(error) }); }
    },
    setPreviewRole() {},
    effectiveRole() { return get().user?.role ?? null; },
  };
});
