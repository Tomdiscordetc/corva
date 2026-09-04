import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
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
  const reduceMotion = useReducedMotion();

  const card: Variants = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1],
        staggerChildren: reduceMotion ? 0 : 0.05,
        delayChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };
  const row: Variants = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
  };

  if (status === "signed-in") {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await login(email, password);
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-surface-sunken px-4">
      {/* Ambientes Licht hinter der Karte: gibt der sonst leeren Fläche Tiefe
          und dem Milchglas der Karte überhaupt etwas zum Streuen. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 size-[760px] -translate-x-1/2 -translate-y-[56%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_30%,transparent),transparent_68%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 size-[520px] -translate-x-[78%] translate-y-1/3 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--color-accent)_16%,transparent),transparent_68%)] blur-3xl" />
      </div>

      <motion.div
        variants={card}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-sm rounded-xl border border-line bg-[color-mix(in_oklch,var(--color-surface-raised)_88%,transparent)] p-8 shadow-[var(--shadow-raised)] backdrop-blur-xl"
      >
        <motion.div variants={row} className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-lg bg-invert text-on-invert">
            <Logo className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text">{t("auth.login.title")}</h1>
            <p className="mt-1 text-sm text-text-muted">{t("auth.login.subtitle")}</p>
          </div>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <motion.div variants={row}>
            <Input
              label={t("auth.login.email")}
              type="email"
              autoComplete="username"
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              trailing={<Mail className="size-4" />}
              invalid={!!error}
              required
            />
          </motion.div>
          <motion.div variants={row}>
            <Input
              label={t("auth.login.password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={!!error}
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
          </motion.div>

          {/* Eine gemeinsame Meldung für beide Felder — sie nennt E-Mail und
              Passwort, darf also an keinem der beiden allein hängen. */}
          {error && (
            <motion.p
              role="alert"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-start gap-2 rounded-md bg-danger-tint px-3 py-2 text-xs text-danger"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </motion.p>
          )}

          <motion.div variants={row} className="flex justify-end">
            <button
              type="button"
              className="text-xs font-medium text-accent-text transition-opacity hover:opacity-80"
            >
              {t("auth.login.forgotPassword")}
            </button>
          </motion.div>

          <motion.div variants={row}>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={status === "authenticating"}
            >
              {status === "authenticating" ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>
          </motion.div>
        </form>

        <motion.p variants={row} className="mt-6 text-center text-2xs text-text-faint">
          {t("auth.login.firstLoginHint")}
        </motion.p>
      </motion.div>
    </div>
  );
}
