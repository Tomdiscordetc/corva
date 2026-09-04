import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo, LogoLockup } from "@/components/shell/Logo";
import { toast } from "@/components/ui/Toast";
import { AuthVisual } from "./AuthVisual";
import { t } from "@/i18n";

const THEME_OPTIONS: { value: ThemeChoice; Icon: typeof Monitor; labelKey: string }[] = [
  { value: "system", Icon: Monitor, labelKey: "topbar.themeSystem" },
  { value: "light", Icon: Sun, labelKey: "topbar.themeLight" },
  { value: "dark", Icon: Moon, labelKey: "topbar.themeDark" },
];

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const clearError = useAuthStore((s) => s.clearError);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [continueToApp, setContinueToApp] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (status !== "signed-in") return;
    const timer = window.setTimeout(() => setContinueToApp(true), reduceMotion ? 120 : 820);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, status]);

  const panel: Variants = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.48,
        ease: [0.32, 0.72, 0, 1],
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.08,
      },
    },
  };
  const row: Variants = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 7 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } },
  };

  if (continueToApp) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await login(email.trim(), password);
  }

  function updateEmail(value: string) {
    if (error) clearError();
    setEmail(value);
  }

  function updatePassword(value: string) {
    if (error) clearError();
    setPassword(value);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface-sunken">
      <div aria-hidden className="auth-page-glow pointer-events-none absolute inset-0" />

      <div
        className="absolute top-4 right-4 z-20 flex rounded-md border border-line bg-surface-overlay p-1 shadow-[var(--shadow-soft)] backdrop-blur-md"
        role="group"
        aria-label={t("topbar.theme")}
      >
        {THEME_OPTIONS.map(({ value, Icon, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={t(labelKey)}
            aria-pressed={theme === value}
            title={t(labelKey)}
            className="flex size-8 items-center justify-center rounded-sm text-text-faint transition-colors duration-[var(--t-fast)] hover:text-text aria-pressed:bg-surface-raised aria-pressed:text-text aria-pressed:shadow-[var(--shadow-soft)]"
          >
            <Icon className="size-3.5" />
          </button>
        ))}
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full lg:grid-cols-2">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.32, 0.72, 0, 1] }}
          className="relative m-3 hidden min-h-0 overflow-hidden rounded-xl bg-auth-brand p-10 text-on-auth-brand lg:flex lg:flex-col"
        >
          <div aria-hidden className="auth-brand-grid pointer-events-none absolute inset-0 opacity-35" />
          <div aria-hidden className="auth-brand-glow pointer-events-none absolute inset-0" />

          <LogoLockup className="relative z-10 text-on-auth-brand" markClassName="text-on-auth-brand" />

          <div className="relative z-10 my-auto flex flex-col items-center py-8 text-center">
            <p className="mb-4 text-2xs font-semibold tracking-widest text-on-auth-brand/55 uppercase">
              {t("auth.login.eyebrow")}
            </p>
            <h1 className="max-w-lg text-2xl font-semibold tracking-tight text-on-auth-brand">
              {t("app.tagline")}
            </h1>
            <AuthVisual />
          </div>

          <p className="relative z-10 text-xs text-on-auth-brand/45">{t("auth.login.channels")}</p>
        </motion.section>

        <section className="flex min-h-dvh items-center justify-center px-5 py-20 sm:px-10 lg:py-10">
          <motion.div variants={panel} initial="hidden" animate="show" className="w-full max-w-md">
            <motion.div variants={row} className="mb-10 lg:hidden">
              <LogoLockup className="text-text" />
            </motion.div>

            <AnimatePresence mode="wait" initial={false}>
              {status === "signed-in" ? (
                <motion.div
                  key="success"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.32, 0.72, 0, 1] }}
                  className="flex flex-col items-center py-16 text-center"
                  role="status"
                >
                  <motion.div
                    className="relative mb-6 flex size-20 items-center justify-center rounded-full bg-positive-tint text-positive"
                    initial={reduceMotion ? false : { scale: 0.72 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <Logo className="size-10" accentClassName="text-positive" />
                    <motion.span
                      initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: reduceMotion ? 0 : 0.24, duration: 0.24 }}
                      className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-4 border-surface-sunken bg-positive text-white"
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </motion.span>
                  </motion.div>
                  <h2 className="text-xl font-semibold tracking-tight text-text">{t("auth.login.successTitle")}</h2>
                  <p className="mt-2 text-sm text-text-muted">{t("auth.login.successSubtitle")}</p>
                  <motion.div className="mt-8 h-1 w-24 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: reduceMotion ? 0.1 : 0.7, ease: "linear" }}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="form" exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}>
                  <motion.div variants={row}>
                    <p className="mb-3 text-xs font-semibold text-accent-text">{t("auth.login.welcome")}</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-text">{t("auth.login.title")}</h2>
                    <p className="mt-2 max-w-sm text-sm text-text-muted">{t("auth.login.subtitle")}</p>
                  </motion.div>

                  <motion.form
                    variants={row}
                    onSubmit={onSubmit}
                    className="mt-8 space-y-5"
                    noValidate
                    animate={error && !reduceMotion ? { x: [0, -5, 4, -2, 0] } : { x: 0 }}
                    transition={{ duration: 0.3 }}
                    aria-busy={status === "authenticating"}
                  >
                    <Input
                      label={t("auth.login.email")}
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoFocus
                      placeholder={t("auth.login.emailPlaceholder")}
                      value={email}
                      onChange={(event) => updateEmail(event.target.value)}
                      trailing={<Mail className="size-4" />}
                      invalid={!!error}
                      disabled={status === "authenticating"}
                      required
                    />
                    <Input
                      label={t("auth.login.password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("auth.login.passwordPlaceholder")}
                      value={password}
                      onChange={(event) => updatePassword(event.target.value)}
                      invalid={!!error}
                      disabled={status === "authenticating"}
                      required
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                          className="pointer-events-auto text-text-faint transition-colors duration-[var(--t-fast)] hover:text-text"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      }
                    />

                    <AnimatePresence initial={false}>
                      {error && (
                        <motion.p
                          role="alert"
                          initial={reduceMotion ? false : { opacity: 0, y: -5, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
                          className="flex items-start gap-2 rounded-md border border-danger/15 bg-danger-tint px-3 py-2.5 text-xs text-danger"
                        >
                          <AlertCircle className="mt-px size-3.5 shrink-0" />
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-2xs text-text-faint">
                        <LockKeyhole className="size-3.5" />
                        {t("auth.login.companyAccount")}
                      </span>
                      <button
                        type="button"
                        onClick={() => toast(t("auth.login.forgotPasswordNotice"))}
                        className="text-xs font-medium text-accent-text transition-opacity duration-[var(--t-fast)] hover:opacity-75"
                      >
                        {t("auth.login.forgotPassword")}
                      </button>
                    </div>

                    <Button type="submit" size="lg" className="group w-full" loading={status === "authenticating"}>
                      <span>{status === "authenticating" ? t("auth.login.submitting") : t("auth.login.submit")}</span>
                      {status !== "authenticating" && (
                        <ArrowRight className="size-4 transition-transform duration-[var(--t-fast)] group-hover:translate-x-0.5" />
                      )}
                    </Button>
                  </motion.form>

                  <motion.p variants={row} className="mt-7 border-t border-line pt-5 text-center text-2xs text-text-faint">
                    {t("auth.login.firstLoginHint")}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
