import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore, type Role } from "@/store/auth";
import { t } from "@/i18n";

interface AccountUser {
  id?: string;
  tenantId?: string;
  name: string;
  email: string;
  role: Role;
}

interface Account {
  user: AccountUser;
  twoFactorEnabled: boolean;
}

export interface AccountSession {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  userAgent: string;
  current: boolean;
}

type Result<T> = { ok: true; value: T } | { ok: false };

function messageFor(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return t("serverSettings.networkError");
}

/** Account data and mutations never use the demo store or browser persistence. */
export function useAccountSettings() {
  const [account, setAccount] = useState<Account | null>(null);
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const updateUser = useAuthStore((state) => state.updateUser);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const value = await api<Account>("/account");
      if (mounted.current) {
        setAccount(value);
        updateUser(value.user);
      }
    } catch (failure) {
      if (mounted.current) setLoadError(messageFor(failure));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [updateUser]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const value = await api<{ sessions: AccountSession[] }>("/account/sessions");
      if (mounted.current) setSessions(value.sessions);
    } catch (failure) {
      if (mounted.current) setSessionsError(messageFor(failure));
    } finally {
      if (mounted.current) setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadAccount();
    void loadSessions();
    return () => { mounted.current = false; };
  }, [loadAccount, loadSessions]);

  async function perform<T>(name: string, task: () => Promise<T>, successKey?: string): Promise<Result<T>> {
    if (inFlight.current) return { ok: false };
    inFlight.current = true;
    setBusy(name);
    setError(null);
    setSuccess(null);
    try {
      const value = await task();
      if (mounted.current && successKey) setSuccess(t(`serverSettings.${successKey}`));
      return { ok: true, value };
    } catch (failure) {
      if (mounted.current) setError(messageFor(failure));
      return { ok: false };
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  return {
    account, sessions, loading, sessionsLoading, loadError, sessionsError,
    error, success, busy, loadAccount, loadSessions,
    clearFeedback() { setError(null); setSuccess(null); },
    saveProfile(name: string) {
      return perform("profile", async () => {
        const value = await api<{ user: AccountUser }>("/account", { method: "PATCH", body: { name: name.trim() } });
        if (mounted.current) {
          setAccount((previous) => previous ? { ...previous, user: value.user } : previous);
          updateUser(value.user);
        }
      }, "profile.saved");
    },
    changePassword(currentPassword: string, newPassword: string, code?: string) {
      return perform("password", async () => {
        await api("/account/password", { method: "POST", body: { currentPassword, newPassword, ...(code ? { code: code.trim() } : {}) } });
        await loadSessions();
      }, "password.saved");
    },
    setupTotp(currentPassword: string) {
      // Secrets are returned directly to the short-lived dialog; never cached.
      return perform("setup", () => api<{ secret: string; uri: string }>("/account/totp/setup", { method: "POST", body: { currentPassword } }));
    },
    enableTotp(code: string) {
      return perform("enable", async () => {
        const value = await api<{ recoveryCodes: string[] }>("/account/totp/enable", { method: "POST", body: { code: code.trim() } });
        if (mounted.current) setAccount((previous) => previous ? { ...previous, twoFactorEnabled: true } : previous);
        await loadSessions();
        return value;
      }, "twoFactor.enabledSuccess");
    },
    disableTotp(currentPassword: string, code: string) {
      return perform("disable", async () => {
        await api("/account/totp/disable", { method: "POST", body: { currentPassword, code: code.trim() } });
        if (mounted.current) setAccount((previous) => previous ? { ...previous, twoFactorEnabled: false } : previous);
        await loadSessions();
      }, "twoFactor.disabledSuccess");
    },
    revokeSession(id: string | null) {
      return perform("sessions", async () => {
        await api(id ? `/account/sessions/${encodeURIComponent(id)}` : "/account/sessions", { method: "DELETE" });
        await loadSessions();
      }, "sessions.revoked");
    },
  };
}

interface Connections {
  emailAvailable: boolean;
  connections: {
    id: "email" | "phone" | "whatsapp" | "social";
    status: "configured" | "not_configured";
    message: string;
  }[];
}

export function useServerConnections() {
  const [data, setData] = useState<Connections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await api<Connections>("/connections");
      if (mounted.current) setData(value);
    } catch (failure) {
      if (mounted.current) setError(messageFor(failure));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => { mounted.current = false; };
  }, [reload]);

  async function sendTest() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setSent(false);
    setError(null);
    try {
      await api("/connections/email/test", { method: "POST" });
      if (mounted.current) setSent(true);
    } catch (failure) {
      if (mounted.current) setError(messageFor(failure));
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return { data, loading, error, busy, sent, reload, sendTest };
}
