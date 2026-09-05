import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordStrength, isPasswordAcceptable } from "@/components/ui/PasswordStrength";
import { useAuthStore } from "@/store/auth";
import { StepFrame } from "./StepFrame";
import { t } from "@/i18n";

/** Erste Anmeldung: Start-Passwort gegen ein eigenes tauschen. */
export function SetPasswordStep() {
  const submitNewPassword = useAuthStore((s) => s.submitNewPassword);
  const busy = useAuthStore((s) => s.busy);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isPasswordAcceptable(password)) {
      setLocalError(t("auth.login.passwordTooWeak"));
      return;
    }
    if (password !== repeat) {
      setLocalError(t("auth.login.passwordMismatch"));
      return;
    }
    setLocalError(null);
    void submitNewPassword(password);
  }

  return (
    <StepFrame
      eyebrow={t("auth.login.setPasswordEyebrow")}
      title={t("auth.login.setPasswordTitle")}
      subtitle={t("auth.login.setPasswordSubtitle")}
      onSubmit={onSubmit}
      busy={busy}
      error={localError}
    >
      <Input
        label={t("auth.login.newPassword")}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        autoFocus
        value={password}
        onChange={(event) => {
          if (localError) setLocalError(null);
          setPassword(event.target.value);
        }}
        trailing={
          <button
            type="button"
            onClick={() => setShow((visible) => !visible)}
            aria-label={show ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
            className="pointer-events-auto text-text-faint transition-colors duration-[var(--t-fast)] hover:text-text"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        required
      />

      <PasswordStrength value={password} />

      <Input
        label={t("auth.login.repeatPassword")}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={repeat}
        onChange={(event) => {
          if (localError) setLocalError(null);
          setRepeat(event.target.value);
        }}
        invalid={!!repeat && repeat !== password}
        required
      />

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        <KeyRound className="size-4" />
        <span>{t("auth.login.savePassword")}</span>
      </Button>
    </StepFrame>
  );
}
