import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/shell/Logo";
import { t } from "@/i18n";

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (status === "signed-in") {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await login(email, password);
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-surface-sunken px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-sm rounded-xl border border-line bg-[color-mix(in_oklch,var(--color-surface-raised)_88%,transparent)] p-8 shadow-[var(--shadow-raised)] backdrop-blur-xl"
      >
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-lg bg-invert text-on-invert">
            <Logo className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text">{t("auth.login.title")}</h1>
            <p className="mt-1 text-sm text-text-muted">{t("auth.login.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label={t("auth.login.email")}
            type="email"
            autoComplete="username"
            placeholder={t("auth.login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            trailing={<Mail className="size-4" />}
            required
          />
          <Input
            label={t("auth.login.password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("auth.login.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                className="pointer-events-auto text-text-faint transition-colors hover:text-text"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-medium text-accent-text transition-opacity hover:opacity-80"
            >
              {t("auth.login.forgotPassword")}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={status === "authenticating"}
          >
            {status === "authenticating" ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-2xs text-text-faint">{t("auth.login.firstLoginHint")}</p>
      </motion.div>
    </div>
  );
}
