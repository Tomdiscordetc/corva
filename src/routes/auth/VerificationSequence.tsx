import { Fingerprint, LockKeyhole } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { t } from "@/i18n";

/** Kurze Übergangsphase zwischen Formular und eigentlicher Entsperrung. */
export function VerificationSequence() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 1.04, filter: "blur(5px)" }}
      transition={{ duration: reduceMotion ? 0 : 0.46, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col items-center py-14 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-8 flex size-32 items-center justify-center" aria-hidden>
        <motion.span
          className="verification-orbit absolute inset-0 rounded-full"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-4 rounded-full border border-accent/20"
          animate={reduceMotion ? undefined : { scale: [0.92, 1.06, 0.92], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-raised text-text shadow-[var(--shadow-unlock)]">
          <LockKeyhole className="size-8" strokeWidth={1.6} />
          <motion.span
            className="verification-scan absolute inset-x-0 h-8"
            initial={reduceMotion ? false : { y: -52, opacity: 0 }}
            animate={reduceMotion ? { opacity: 0 } : { y: [-52, 52], opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <motion.span
          className="absolute right-1 bottom-2 flex size-9 items-center justify-center rounded-full border-4 border-surface-sunken bg-accent text-text-on-accent"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.35 }}
        >
          <Fingerprint className="size-4" />
        </motion.span>
      </div>

      <p className="text-xs font-semibold text-accent-text">{t("auth.login.verificationEyebrow")}</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-text">{t("auth.login.verificationTitle")}</h1>
      <p className="mt-2 text-sm text-text-muted">{t("auth.login.verificationSubtitle")}</p>

      <div className="mt-7 flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-1.5 rounded-full bg-accent"
            animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
            transition={{ duration: 1.35, repeat: Infinity, delay: dot * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
