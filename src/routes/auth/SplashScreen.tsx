import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { CORVA_LOGO_PATHS } from "@/components/shell/Logo";
import { t } from "@/i18n";

const DRAW = [
  [CORVA_LOGO_PATHS[0], "var(--color-text)"],
  [CORVA_LOGO_PATHS[1], "var(--color-accent)"],
] as const;

/** Marken-Startbildschirm, einmal pro Browser-Sitzung. */
export function SplashScreen() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("corva.splash-seen", "1");
      navigate("/login", { replace: true });
    }, reduceMotion ? 300 : 1400);
    const readyTimer = window.setTimeout(() => setReady(true), 50);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(readyTimer);
    };
  }, [navigate, reduceMotion]);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center gap-4 overflow-hidden bg-surface-sunken">
      <div aria-hidden className="auth-page-glow pointer-events-none absolute inset-0" />
      <motion.div
        className="relative flex size-24 items-center justify-center rounded-full border border-line bg-surface-overlay shadow-[var(--shadow-raised)] backdrop-blur-lg"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={ready ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
      >
        <svg viewBox="0 0 40 40" fill="none" className="size-14">
          {DRAW.map(([d, stroke], index) => (
            <motion.path
              key={d}
              d={d}
              stroke={stroke}
              strokeWidth="3.2"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={ready ? { pathLength: 1, opacity: 1 } : {}}
              transition={{
                duration: reduceMotion ? 0 : 0.9,
                ease: [0.32, 0.72, 0, 1],
                delay: reduceMotion ? 0 : index * 0.12,
              }}
            />
          ))}
        </svg>
      </motion.div>
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.5 }}
        className="text-sm font-semibold tracking-wide text-text"
      >
        {t("app.name").toLowerCase()}
      </motion.p>
    </div>
  );
}
