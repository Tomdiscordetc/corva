import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth";
import { StepFrame, StepDots } from "./StepFrame";
import { t } from "@/i18n";

/** Schritt 1: E-Mail-Adresse. Trennt Konto-Erkennung vom Passwort. */
export function IdentifyStep() {
  const storedEmail = useAuthStore((s) => s.email);
  const submitEmail = useAuthStore((s) => s.submitEmail);
  const goToStep = useAuthStore((s) => s.goToStep);
  const clearError = useAuthStore((s) => s.clearError);
  const error = useAuthStore((s) => s.error);
  const busy = useAuthStore((s) => s.busy);
  const [email, setEmail] = useState(storedEmail);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitEmail(email);
  }

  return (
    <>
      <StepDots current={1} total={2} />
      <StepFrame
        eyebrow={t("auth.login.welcome")}
        title={t("auth.login.title")}
        subtitle={t("auth.login.emailStepSubtitle")}
        onSubmit={onSubmit}
        error={error}
        footer={
          <p className="text-center text-2xs text-text-faint">{t("auth.login.firstLoginHint")}</p>
        }
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

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-2xs text-text-faint">
            <LockKeyhole className="size-3.5" />
            {t("auth.login.companyAccount")}
          </span>
          <button
            type="button"
            onClick={() => goToStep("recover")}
            className="text-xs font-medium text-accent-text transition-opacity duration-[var(--t-fast)] hover:opacity-75"
          >
            {t("auth.login.forgotPassword")}
          </button>
        </div>

        <Button type="submit" size="lg" className="group w-full" loading={busy}>
          <span>{t("auth.login.continue")}</span>
          <ArrowRight className="size-4 transition-transform duration-[var(--t-fast)] group-hover:translate-x-0.5" />
        </Button>
      </StepFrame>
    </>
  );
}
