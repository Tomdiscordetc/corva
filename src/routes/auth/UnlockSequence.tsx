import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/shell/Logo";
import { t } from "@/i18n";

export const UNLOCK_DURATION_MS = 2900;

/** Zeichnet ein Schloss, öffnet den Bügel und gibt das Corva-Zeichen frei. */
export function UnlockSequence() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col items-center py-12 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-8 flex size-36 items-center justify-center" aria-hidden>
        <motion.span
          className="unlock-orbit absolute inset-0 rounded-full"
          initial={reduceMotion ? false : { opacity: 0, rotate: -70, scale: 0.78 }}
          animate={{ opacity: [0, 0.8, 0.8, 0], rotate: [-70, 0, 220, 280], scale: [0.78, 1, 1, 1.12] }}
          transition={{ duration: reduceMotion ? 0 : 2.55, times: [0, 0.18, 0.78, 1], ease: [0.32, 0.72, 0, 1] }}
        />
        <motion.span
          className="absolute inset-4 rounded-full border border-accent/25"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.86, 1, 1.06, 1.18] }}
          transition={{ duration: reduceMotion ? 0 : 2.45, times: [0, 0.2, 0.76, 1], ease: "easeInOut" }}
        />

        <motion.div
          className="relative flex size-24 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-raised shadow-[var(--shadow-unlock)]"
          initial={reduceMotion ? false : { y: 8, scale: 0.88 }}
          animate={{ y: 0, scale: [0.88, 1, 1, 1.04] }}
          transition={{ duration: reduceMotion ? 0 : 2.35, times: [0, 0.2, 0.78, 1], ease: [0.32, 0.72, 0, 1] }}
        >
          <Logo className="relative z-0 size-11 text-text" />

          <motion.span
            className="absolute inset-y-0 left-0 z-10 w-1/2 border-r border-line bg-surface-raised"
            animate={reduceMotion ? { x: "-105%" } : { x: ["0%", "0%", "-105%"] }}
            transition={{ duration: reduceMotion ? 0 : 1.85, times: [0, 0.62, 1], ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.span
            className="absolute inset-y-0 right-0 z-10 w-1/2 border-l border-line bg-surface-raised"
            animate={reduceMotion ? { x: "105%" } : { x: ["0%", "0%", "105%"] }}
            transition={{ duration: reduceMotion ? 0 : 1.85, times: [0, 0.62, 1], ease: [0.32, 0.72, 0, 1] }}
          />

          <motion.svg
            viewBox="0 0 48 48"
            fill="none"
            className="absolute z-20 size-12 text-text"
            animate={reduceMotion ? { opacity: 0 } : { opacity: [1, 1, 1, 0], y: [0, 0, -2, 7], scale: [1, 1, 1, 0.86] }}
            transition={{ duration: 1.72, times: [0, 0.48, 0.72, 1], ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.path
              d="M15 22v-5a9 9 0 0 1 18 0v5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={reduceMotion ? { pathLength: 1 } : { pathLength: 1, y: [0, 0, -4, -4], rotate: [0, 0, -11, -11] }}
              transition={{ duration: reduceMotion ? 0 : 1.3, times: [0, 0.5, 0.8, 1], ease: [0.32, 0.72, 0, 1] }}
              style={{ transformOrigin: "15px 22px" }}
            />
            <motion.rect
              x="10"
              y="21"
              width="28"
              height="21"
              rx="6"
              stroke="currentColor"
              strokeWidth="3"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.16 }}
            />
            <motion.path
              d="M24 29v5"
              stroke="var(--color-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.55 }}
            />
          </motion.svg>
        </motion.div>

        <motion.span
          className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full border-4 border-surface-sunken bg-positive text-white shadow-[var(--shadow-soft)]"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.3, rotate: -35 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 1.82, ease: [0.32, 0.72, 0, 1] }}
        >
          <Check className="size-4" strokeWidth={3} />
        </motion.span>
      </div>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 1.52 }}
        className="text-xs font-semibold text-positive"
      >
        {t("auth.login.accessConfirmed")}
      </motion.p>
      <motion.h2
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.48, delay: reduceMotion ? 0 : 1.68 }}
        className="mt-3 text-xl font-semibold tracking-tight text-text"
      >
        {t("auth.login.unlockTitle")}
      </motion.h2>
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.48, delay: reduceMotion ? 0 : 1.9 }}
        className="mt-2 text-sm text-text-muted"
      >
        {t("auth.login.unlockSubtitle")}
      </motion.p>
    </motion.div>
  );
}
