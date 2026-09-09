import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowUpRight, AtSign, MessageCircle, Monitor, Moon, Pause, Phone, Play, Radio, Sun } from "lucide-react";
import { SERVER_MODE, useAuthStore } from "@/store/auth";
import { ServerSession } from "@/components/system/ServerSession";
import { useThemeStore, type ThemeChoice } from "@/store/theme";
import { LogoLockup } from "@/components/shell/Logo";
import { cn } from "@/lib/cn";
import { AuthVisual, AUTH_SEQUENCE_MS, type AuthPhase } from "./AuthVisual";
import { LoginScene } from "./LoginScene";
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

/** Die vier Kanäle unter der Überschrift — Reihenfolge wie im Vertrieb. */
const SCENE_CHANNELS = [
  { key: "email", Icon: AtSign },
  { key: "phone", Icon: Phone },
  { key: "whatsapp", Icon: MessageCircle },
  { key: "social", Icon: Radio },
] as const;

export function LoginPage() {
  const [scenePaused, setScenePaused] = useState(false);
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
    <main className="auth-login" data-login-theme={theme} data-phase={visualPhase}>
      <LoginScene phase={visualPhase} paused={scenePaused} />
      <div className="auth-scene-vignette" aria-hidden />

      <header className="auth-login-header">
        <Link to="/login" aria-label="Corva" className="auth-login-wordmark">
          <LogoLockup />
        </Link>
        <div className="auth-login-controls" inert={authFlowActive}>
          <span className="auth-login-header-caption">{t("auth.login.eyebrow")}</span>
          <div className="auth-theme-switch" role="group" aria-label={t("topbar.theme")}>
            {THEME_OPTIONS.map(({ value, Icon, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-label={t(labelKey)}
                aria-pressed={theme === value}
                title={t(labelKey)}
              >
                <Icon aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="auth-login-layout">
        <section className="auth-login-story" aria-label={t("app.tagline")} inert={authFlowActive}>
          <div className="auth-scene-caption" aria-hidden>
            <span className="auth-scene-caption-line" />
            <span>{t("auth.login.sceneBadge")}</span>
          </div>
          <motion.div variants={panel} initial="hidden" animate="show" className="auth-story-copy">
            <motion.p variants={row} className="auth-story-eyebrow">
              <span aria-hidden />{t("auth.login.sceneEyebrow")}
            </motion.p>
            <motion.h2 variants={row} className="auth-story-title">
              {t("auth.login.sceneTitle")}<br />
              <span>{t("auth.login.sceneTitleAccent")}</span>
            </motion.h2>
            <motion.p variants={row} className="auth-story-description">{t("app.tagline")}.</motion.p>
            <motion.div variants={row} className="auth-channel-list">
              {SCENE_CHANNELS.map(({ key, Icon }) => (
                <span key={key}><Icon aria-hidden />{t(`auth.login.sceneChannel.${key}`)}</span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <section className="auth-form-region" inert={authFlowActive} aria-hidden={authFlowActive}>
          <motion.div variants={panel} initial="hidden" animate="show" className="auth-form-card">
            <div className="auth-card-topline" aria-hidden>
              <span className="auth-card-mini-mark"><ArrowUpRight /></span>
              <span>{t("auth.login.sceneWorkspace")}</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {authFlowActive ? null : (
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, x: direction > 0 ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: reduceMotion ? 0 : 0.36 } }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : direction > 0 ? -24 : 24, transition: { duration: reduceMotion ? 0 : 0.2 } }}
                >
                  <StepView />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <nav className="auth-legal-links" aria-label={t("legal.footerLabel")}>
            <Link to="/impressum">{t("legal.imprintLink")}</Link>
            <span aria-hidden>·</span>
            <Link to="/datenschutz">{t("legal.privacyLink")}</Link>
          </nav>
        </section>
      </div>

      <footer className="auth-login-footer">
        <span>{t("auth.login.sceneFooter")}</span>
        <button
          type="button"
          className="auth-motion-control"
          onClick={() => setScenePaused((value) => !value)}
          aria-pressed={scenePaused || !!reduceMotion}
          disabled={!!reduceMotion}
          aria-label={t(reduceMotion ? "auth.login.sceneReduced" : scenePaused ? "auth.login.sceneResume" : "auth.login.scenePause")}
        >
          {scenePaused || reduceMotion ? <Play aria-hidden /> : <Pause aria-hidden />}
          {t(reduceMotion ? "auth.login.sceneReduced" : scenePaused ? "auth.login.sceneResume" : "auth.login.scenePause")}
        </button>
      </footer>

      <AnimatePresence>
        {authFlowActive && (
          <motion.section
            key="auth-unlock"
            className="auth-login-unlock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            aria-label={t(visualPhase === "granted" ? "auth.login.statusGranted" : "auth.login.statusChecking")}
          >
            <AuthVisual phase={visualPhase} />
            <p role="status" className={cn("auth-unlock-status", visualPhase === "granted" && "auth-unlock-status-granted")}>
              <span aria-hidden />
              {t(visualPhase === "granted" ? "auth.login.statusGranted" : "auth.login.statusChecking")}
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
