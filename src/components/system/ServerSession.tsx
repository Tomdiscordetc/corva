import { useEffect } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { SERVER_MODE, useAuthStore } from "@/store/auth";
import { LogoLockup } from "@/components/shell/Logo";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { t } from "@/i18n";

/** Public legal pages stay accessible even while the session API is unavailable. */
export function AuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const expireSession = useAuthStore((s) => s.expireSession);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);

  useEffect(() => {
    if (!SERVER_MODE) return;
    void bootstrap();
    const refresh = () => {
      const state = useAuthStore.getState();
      if (document.visibilityState === "visible" && !state.busy && !state.resetToken) void bootstrap();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("corva:unauthorized", expireSession);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("corva:unauthorized", expireSession);
    };
  }, [bootstrap, expireSession]);

  useEffect(() => {
    if (SERVER_MODE && status === "signed-in" && error) toast.error(error);
  }, [status, error]);
  return null;
}

export function ServerSession() {
  const error = useAuthStore((s) => s.checkError);
  const checking = useAuthStore((s) => s.checking);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-sunken px-6 py-10">
      <section className="w-full max-w-md space-y-6 rounded-xl border border-line bg-surface p-8 shadow-[var(--shadow-raised)]">
        <LogoLockup className="text-text" />
        {error ? <>
          <h1 className="text-xl font-semibold tracking-tight text-text">{t("serverAuth.connectionTitle")}</h1>
          <p role="alert" className="text-sm text-danger">{error}</p>
          <p className="text-sm text-text-muted">{t("serverAuth.connectionHint")}</p>
          <Button onClick={() => void bootstrap()} loading={checking}><RefreshCw className="size-4" aria-hidden />{t("serverAuth.retry")}</Button>
        </> : <p role="status" className="flex items-center gap-3 text-sm text-text-muted"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />{t("serverAuth.checking")}</p>}
      </section>
    </main>
  );
}
