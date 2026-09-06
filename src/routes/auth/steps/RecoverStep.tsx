import { useState, type FormEvent } from "react";
import { Mail, MailCheck, Send } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SERVER_MODE, useAuthStore } from "@/store/auth";
import { StepFrame } from "./StepFrame";
import { t } from "@/i18n";

/** Seitenzweig: Link zum Zurücksetzen anfordern. */
export function RecoverStep() {
  const storedEmail = useAuthStore((s) => s.email);
  const requestRecovery = useAuthStore((s) => s.requestRecovery);
  const goToStep = useAuthStore((s) => s.goToStep);
  const clearError = useAuthStore((s) => s.clearError);
  const error = useAuthStore((s) => s.error);
  const busy = useAuthStore((s) => s.busy);
  const [email, setEmail] = useState(storedEmail);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void requestRecovery(email);
  }

  return (
    <StepFrame
      eyebrow={t("auth.login.recoverEyebrow")}
      title={t("auth.login.recoverTitle")}
      subtitle={t("auth.login.recoverSubtitle")}
      onSubmit={onSubmit}
      busy={busy}
      error={error}
      onBack={() => goToStep("identify")}
      backLabel={t("auth.login.backToLogin")}
    >
      <Input
        label={t("auth.login.email")}
        type="email"
        inputMode="email"
        autoComplete="username"
        autoFocus
        placeholder={t("auth.login.emailPlaceholder")}
        value={email}
        onChange={(event) => {
          if (error) clearError();
          setEmail(event.target.value);
        }}
        trailing={<Mail className="size-4" />}
        invalid={!!error}
        required
      />

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        <Send className="size-4" />
        <span>{t("auth.login.recoverSubmit")}</span>
      </Button>
    </StepFrame>
  );
}

/** Bestätigung nach dem Anfordern — bewusst ohne Aussage, ob das Konto existiert. */
export function RecoverSentStep() {
  const email = useAuthStore((s) => s.email);
  const goToStep = useAuthStore((s) => s.goToStep);
  const reduceMotion = useReducedMotion();

  return (
    <div className="py-6 text-center" role="status" aria-live="polite">
      <motion.div
        initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="relative mx-auto mb-7 flex size-20 items-center justify-center rounded-xl border border-line bg-surface-raised text-accent shadow-[var(--shadow-raised)]"
      >
        <MailCheck className="size-8" strokeWidth={1.6} />
        {[0, 1].map((ring) => (
          <motion.span
            key={ring}
            className="absolute inset-0 rounded-xl border border-accent/25"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={reduceMotion ? { opacity: 0 } : { opacity: [0, 0.5, 0], scale: [0.8, 1.3, 1.55] }}
            transition={{ duration: 1.6, delay: 0.3 + ring * 0.25, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
          />
        ))}
      </motion.div>

      <h1 className="text-xl font-semibold tracking-tight text-text">{t("auth.login.recoverSentTitle")}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
        {t(SERVER_MODE ? "serverAuth.recoverySent" : "auth.login.recoverSentSubtitle", { email })}
      </p>

      <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={() => goToStep("identify")}>
        {t("auth.login.backToLogin")}
      </Button>

      <p className="mt-6 border-t border-line pt-5 text-2xs text-text-faint">
        {t(SERVER_MODE ? "serverAuth.recoverySentHint" : "auth.login.recoverSentDemoHint")}
      </p>
    </div>
  );
}
