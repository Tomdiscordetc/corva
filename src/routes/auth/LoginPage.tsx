import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { SERVER_MODE, useAuthStore } from "@/store/auth";
import { ServerSession } from "@/components/system/ServerSession";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { LogoLockup } from "@/components/shell/Logo";
import { cn } from "@/lib/cn";
import { AuthVisual, AUTH_SEQUENCE_MS, type AuthPhase } from "./AuthVisual";
import { IdentifyStep } from "./steps/IdentifyStep";
import { PasswordStep } from "./steps/PasswordStep";
import { TwoFactorStep } from "./steps/TwoFactorStep";
import { SetPasswordStep } from "./steps/SetPasswordStep";
import { RecoverStep, RecoverSentStep } from "./steps/RecoverStep";
import { t } from "@/i18n";

const THEME_OPTIONS: { value: ThemeChoice; Icon: typeof Monitor; labelKey: string }[] = [
  { value: "system", Icon: Monitor, labelKey: "topbar.themeSystem" },
  { value: "light", Icon: Sun, labelKey: "topbar.themeLight" },
  { value: "dark", Icon: Moon, labelKey: "topbar.themeDark" },
];

/** Reihenfolge der Schritte im Formularbereich. */
const STEP_VIEWS = {
  identify: IdentifyStep,
  password: PasswordStep,
  twoFactor: TwoFactorStep,
  setPassword: SetPasswordStep,
  recover: RecoverStep,
  recoverSent: RecoverSentStep,
} as const;

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const checked = useAuthStore((s) => s.checked);
  const freshLogin = useAuthStore((s) => s.freshLogin);
  const beginReset = useAuthStore((s) => s.beginReset);
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = SERVER_MODE ? searchParams.get("reset") : null;
  const step = useAuthStore((s) => s.step);
  const direction = useAuthStore((s) => s.direction);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const authFlowActive = status !== "signed-out";
  const StepView = STEP_VIEWS[step];
  const visualPhase: AuthPhase =
    status === "signed-in" ? "granted" : status === "authenticating" ? "checking" : "idle";

  useEffect(() => {
    if (!resetToken) return;
    beginReset(resetToken);
    const cleanParams = new URLSearchParams(searchParams);
    cleanParams.delete("reset");
    setSearchParams(cleanParams, { replace: true });
  }, [resetToken, searchParams, setSearchParams, beginReset]);

  /*
    Der Wechsel läuft bewusst über navigate() statt <Navigate>: nur so lässt
    sich die View-Transition auslösen, die das Signet aus der Entsperr-Sequenz
    an seinen Platz in der Icon-Leiste wandern lässt (siehe .corva-mark-morph).
  */
  useEffect(() => {
    if (status !== "signed-in" || !checked || resetToken) return;
    if (!freshLogin) {
      navigate("/app", { replace: true });
      return;
    }
    const timer = window.setTimeout(
      () => navigate("/app", { replace: true, viewTransition: true }),
      reduceMotion ? 120 : AUTH_SEQUENCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [navigate, reduceMotion, status, freshLogin, checked, resetToken]);

  const panel: Variants = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.72,
        ease: [0.32, 0.72, 0, 1],
        staggerChildren: reduceMotion ? 0 : 0.09,
        delayChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };
  const row: Variants = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 7 },
    show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.32, 0.72, 0, 1] } },
  };

  if (!checked || resetToken) return <ServerSession />;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface-sunken">
      <div aria-hidden className="auth-page-glow pointer-events-none absolute inset-0" />

      <motion.div
        initial={false}
        animate={{ opacity: authFlowActive ? 0 : 1, y: authFlowActive ? -8 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.38 }}
        className="absolute top-4 right-4 z-20 flex rounded-md border border-line bg-surface-overlay p-1 shadow-[var(--shadow-soft)] backdrop-blur-md"
        role="group"
        aria-label={t("topbar.theme")}
        style={{ pointerEvents: authFlowActive ? "none" : "auto" }}
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
      </motion.div>

      <div className="relative mx-auto min-h-dvh w-full">
        {/*
          Während der Anmeldung wird das Markenfeld zur Bühne: es bleibt
          stehen, wächst auf die volle Breite und spielt die Kette ab. Auf
          schmalen Bildschirmen gibt es sonst kein Panel — dort tritt es für
          die Dauer der Anmeldung an die Stelle des Formulars.
        */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            "absolute inset-y-0 left-0 p-3",
            "transition-[width] duration-[var(--t-auth-swipe)] ease-[var(--ease-standard)]",
            authFlowActive ? "z-10 w-full" : "hidden w-1/2 lg:block",
          )}
        >
          <section className="relative flex size-full min-h-0 flex-col overflow-hidden rounded-xl bg-auth-brand p-10 text-on-auth-brand">
            <div aria-hidden className="auth-brand-grid pointer-events-none absolute inset-0 opacity-35" />
            <div aria-hidden className="auth-brand-glow pointer-events-none absolute inset-0" />

            <LogoLockup className="relative z-10 text-on-auth-brand" markClassName="text-on-auth-brand" />

            <div className="relative z-10 my-auto flex flex-col items-center py-8 text-center">
              <motion.div
                animate={{ opacity: authFlowActive ? 0 : 1, y: authFlowActive ? -6 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.4 }}
              >
                <p className="mb-4 text-2xs font-semibold tracking-widest text-on-auth-brand/55 uppercase">
                  {t("auth.login.eyebrow")}
                </p>
                <p className="max-w-lg text-2xl font-semibold tracking-tight text-on-auth-brand">
                  {t("app.tagline")}
                </p>
              </motion.div>
              <AuthVisual phase={visualPhase} />
            </div>

            <p
              role="status"
              className="relative z-10 flex items-center gap-2 text-xs text-on-auth-brand/55"
            >
              {authFlowActive && (
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{
                    background:
                      visualPhase === "granted"
                        ? "var(--color-auth-granted)"
                        : "var(--color-auth-pending)",
                  }}
                />
              )}
              {authFlowActive
                ? t(visualPhase === "granted" ? "auth.login.statusGranted" : "auth.login.statusChecking")
                : t("auth.login.channels")}
            </p>
          </section>
        </motion.div>

        <section
          aria-hidden={authFlowActive}
          className={cn(
            "relative ml-auto flex min-h-dvh w-full items-center justify-center px-5 py-20",
            "transition-opacity duration-[var(--t-slow)] ease-[var(--ease-standard)] sm:px-10 lg:py-10 lg:w-1/2",
            authFlowActive && "pointer-events-none opacity-0",
          )}
        >
          <motion.div
            aria-hidden
            className="auth-unlock-field pointer-events-none absolute inset-0"
            initial={false}
            animate={{ opacity: authFlowActive ? 1 : 0, scale: authFlowActive ? 1 : 0.94 }}
            transition={{ duration: reduceMotion ? 0 : 1.25, ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.div variants={panel} initial="hidden" animate="show" className="w-full max-w-md">
            <motion.div
              variants={row}
              animate={{ opacity: authFlowActive ? 0 : 1, y: authFlowActive ? -8 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.38 }}
              className="mb-10 lg:hidden"
            >
              <LogoLockup className="text-text" />
            </motion.div>

            {/*
              Der Schrittwechsel nutzt bewusst direkte Werte statt benannter
              Varianten: das umgebende Panel vererbt seine Variantennamen an
              alle motion-Kinder, wodurch die Aus-Animation des Schritts
              hängen blieb und der nächste Schritt nie erschien.
            */}
            <AnimatePresence mode="wait" initial={false}>
              {authFlowActive ? null : (
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, x: direction > 0 ? 34 : -34, filter: "blur(4px)" }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    filter: "blur(0px)",
                    transition: { duration: reduceMotion ? 0 : 0.42, ease: [0.32, 0.72, 0, 1] },
                  }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          x: direction > 0 ? -34 : 34,
                          filter: "blur(4px)",
                          transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                        }
                  }
                >
                  <StepView />
                </motion.div>
              )}
            </AnimatePresence>

            {/*
              Pflichtangaben nach § 5 DDG und Art. 13 DSGVO müssen von der
              ersten Seite aus erreichbar sein. Während der Anmeldung treten
              sie zurück, damit sie die Choreografie nicht stören.
            */}
            <motion.nav
              aria-label={t("legal.footerLabel")}
              initial={false}
              animate={{ opacity: authFlowActive ? 0 : 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.38 }}
              style={{ pointerEvents: authFlowActive ? "none" : "auto" }}
              className="mt-10 flex items-center justify-center gap-4 text-2xs text-text-faint"
            >
              <Link
                to="/impressum"
                className="rounded-sm transition-colors duration-[var(--t-fast)] hover:text-text-muted"
              >
                {t("legal.imprintLink")}
              </Link>
              <span aria-hidden>·</span>
              <Link
                to="/datenschutz"
                className="rounded-sm transition-colors duration-[var(--t-fast)] hover:text-text-muted"
              >
                {t("legal.privacyLink")}
              </Link>
            </motion.nav>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
