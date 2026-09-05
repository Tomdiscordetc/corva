import type { FormEvent, ReactNode } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { t } from "@/i18n";

interface StepFrameProps {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  onSubmit: (event: FormEvent) => void;
  error?: string | null;
  /** Zeigt links oben eine Zurück-Schaltfläche. */
  onBack?: () => void;
  backLabel?: string;
  footer?: ReactNode;
}

/**
 * Gemeinsames Gerüst aller Anmeldeschritte: Überschriften, Fehlerbox mit
 * Rüttler, Zurück-Weg und Fußzeile. Hält die Schritte selbst kurz.
 */
export function StepFrame({
  eyebrow,
  title,
  subtitle,
  children,
  onSubmit,
  error,
  onBack,
  backLabel,
  footer,
}: StepFrameProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="group mb-5 -ml-1 inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-xs font-medium text-text-muted transition-colors duration-[var(--t-fast)] hover:text-text"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-[var(--t-fast)] group-hover:-translate-x-0.5" />
          {backLabel ?? t("auth.login.back")}
        </button>
      )}

      <p className="mb-3 text-xs font-semibold text-accent-text">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-text">{title}</h2>
      <div className="mt-2 max-w-sm text-sm text-text-muted">{subtitle}</div>

      <motion.form
        onSubmit={onSubmit}
        className="mt-8 space-y-5"
        noValidate
        animate={error && !reduceMotion ? { x: [0, -5, 4, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}

        <AnimatePresence initial={false}>
          {error && (
            <motion.p
              role="alert"
              initial={reduceMotion ? false : { opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-start gap-2 overflow-hidden rounded-md border border-danger/15 bg-danger-tint px-3 py-2.5 text-xs text-danger"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>

      {footer && <div className="mt-7 border-t border-line pt-5">{footer}</div>}
    </div>
  );
}

/** Punktreihe, die den Fortschritt im Anmeldeablauf zeigt. */
export function StepDots({ current, total }: { current: number; total: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="mb-7 flex items-center gap-1.5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={t("auth.login.stepOf", { current, total })}
    >
      {Array.from({ length: total }, (_, index) => (
        <motion.span
          key={index}
          initial={false}
          animate={{
            width: index === current - 1 ? 22 : 6,
            opacity: index < current ? 1 : 0.35,
          }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.32, 0.72, 0, 1] }}
          className="h-1.5 rounded-full bg-accent"
        />
      ))}
    </div>
  );
}
