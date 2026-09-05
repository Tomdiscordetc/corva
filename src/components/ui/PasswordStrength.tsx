import { Check, Minus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export interface PasswordRule {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", label: t("auth.login.ruleLength"), test: (v) => v.length >= 10 },
  { key: "case", label: t("auth.login.ruleCase"), test: (v) => /[a-zäöüß]/.test(v) && /[A-ZÄÖÜ]/.test(v) },
  { key: "digit", label: t("auth.login.ruleDigit"), test: (v) => /\d/.test(v) },
  { key: "symbol", label: t("auth.login.ruleSymbol"), test: (v) => /[^\w\s]/.test(v) },
];

export function passwordScore(value: string) {
  return PASSWORD_RULES.filter((rule) => rule.test(value)).length;
}

export function isPasswordAcceptable(value: string) {
  return passwordScore(value) === PASSWORD_RULES.length;
}

const BAR_TONES = ["bg-danger", "bg-danger", "bg-warning", "bg-warning", "bg-positive"];

/** Stärkebalken plus Regelliste — beides bewegt sich beim Tippen mit. */
export function PasswordStrength({ value }: { value: string }) {
  const reduceMotion = useReducedMotion();
  const score = passwordScore(value);
  const label =
    score >= PASSWORD_RULES.length
      ? t("auth.login.strengthStrong")
      : score >= 2
        ? t("auth.login.strengthMedium")
        : t("auth.login.strengthWeak");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-1.5 flex-1 gap-1" aria-hidden>
          {PASSWORD_RULES.map((_, index) => (
            <motion.span
              key={index}
              className={cn(
                "h-full flex-1 rounded-full",
                index < score ? BAR_TONES[score] : "bg-line",
              )}
              initial={false}
              animate={{ scaleY: index < score ? 1 : 0.55 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
              style={{ transformOrigin: "center" }}
            />
          ))}
        </div>
        <span className="w-14 shrink-0 text-right text-2xs text-text-muted">
          {t("auth.login.strengthLabel")}: {label}
        </span>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li key={rule.key} className="flex items-center gap-1.5 text-2xs">
              <motion.span
                initial={false}
                animate={{ scale: met ? 1 : 0.9, opacity: met ? 1 : 0.6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
                className={cn(
                  "flex size-4 items-center justify-center rounded-full",
                  met ? "bg-positive-tint text-positive" : "bg-surface-muted text-text-faint",
                )}
              >
                {met ? <Check className="size-2.5" strokeWidth={3} /> : <Minus className="size-2.5" />}
              </motion.span>
              <span className={met ? "text-text-muted" : "text-text-faint"}>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
