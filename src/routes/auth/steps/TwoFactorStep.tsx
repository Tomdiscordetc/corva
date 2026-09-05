import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CodeInput } from "@/components/ui/CodeInput";
import { toast } from "@/components/ui/Toast";
import { useAuthStore, DEMO_TWO_FACTOR_CODE } from "@/store/auth";
import { StepFrame } from "./StepFrame";
import { t } from "@/i18n";

/** Zweiter Faktor: sechsstelliger Code, sobald das Gerät unbekannt ist. */
export function TwoFactorStep() {
  const email = useAuthStore((s) => s.email);
  const submitTwoFactor = useAuthStore((s) => s.submitTwoFactor);
  const resendCode = useAuthStore((s) => s.resendCode);
  const tickResend = useAuthStore((s) => s.tickResend);
  const resendIn = useAuthStore((s) => s.resendIn);
  const back = useAuthStore((s) => s.back);
  const clearError = useAuthStore((s) => s.clearError);
  const error = useAuthStore((s) => s.error);
  const busy = useAuthStore((s) => s.busy);
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(tickResend, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn, tickResend]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitTwoFactor(code, trustDevice);
  }

  return (
    <StepFrame
      eyebrow={t("auth.login.twoFactorEyebrow")}
      title={t("auth.login.twoFactorTitle")}
      subtitle={t("auth.login.twoFactorSubtitle", { email })}
      onSubmit={onSubmit}
      error={error}
      onBack={back}
      footer={
        <p className="text-center text-2xs text-text-faint">
          {t("auth.login.twoFactorDemoHint", { code: DEMO_TWO_FACTOR_CODE })}
        </p>
      }
    >
      <CodeInput
        label={t("auth.login.twoFactorLabel")}
        value={code}
        onChange={(value) => {
          if (error) clearError();
          setCode(value);
        }}
        onComplete={(value) => void submitTwoFactor(value, trustDevice)}
        invalid={!!error}
        disabled={busy}
        autoFocus
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <Checkbox checked={trustDevice} onCheckedChange={setTrustDevice} label={t("auth.login.trustDevice")} />
          <p className="mt-1 ml-6 text-2xs text-text-faint">{t("auth.login.trustDeviceHint")}</p>
        </div>
        <button
          type="button"
          disabled={resendIn > 0 || busy}
          onClick={() => {
            void resendCode().then(() => toast(t("auth.login.codeResent")));
          }}
          className="shrink-0 text-xs font-medium text-accent-text transition-opacity duration-[var(--t-fast)] hover:opacity-75 disabled:text-text-faint disabled:hover:opacity-100"
        >
          {resendIn > 0 ? t("auth.login.resendCodeIn", { seconds: resendIn }) : t("auth.login.resendCode")}
        </button>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        <ShieldCheck className="size-4" />
        <span>{t("auth.login.verifyCode")}</span>
      </Button>
    </StepFrame>
  );
}
