import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Eye, EyeOff, ChevronDown, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth";
import { StepFrame, StepDots } from "./StepFrame";
import { t } from "@/i18n";

/** Schritt 2: Passwort zum bereits erkannten Konto. */
export function PasswordStep() {
  const email = useAuthStore((s) => s.email);
  const submitPassword = useAuthStore((s) => s.submitPassword);
  const back = useAuthStore((s) => s.back);
  const goToStep = useAuthStore((s) => s.goToStep);
  const clearError = useAuthStore((s) => s.clearError);
  const error = useAuthStore((s) => s.error);
  const busy = useAuthStore((s) => s.busy);
  const rememberMe = useAuthStore((s) => s.rememberMe);
  const setRememberMe = useAuthStore((s) => s.setRememberMe);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const reduceMotion = useReducedMotion();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitPassword(password);
  }

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <>
      <StepDots current={2} total={2} />
      <StepFrame
        eyebrow={t("auth.login.verificationEyebrow")}
        title={t("auth.login.passwordStepTitle")}
        subtitle={t("auth.login.passwordStepSubtitle")}
        onSubmit={onSubmit}
        error={error}
        onBack={back}
        backLabel={t("auth.login.changeEmail")}
      >
        <button
          type="button"
          onClick={back}
          className="flex w-full items-center gap-2.5 rounded-md border border-line bg-surface-subtle px-3 py-2.5 text-left transition-colors duration-[var(--t-fast)] hover:bg-surface-hover"
        >
          <Avatar name={email} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm text-text">{email}</span>
          <ChevronDown className="size-4 shrink-0 text-text-faint" />
        </button>

        <Input
          label={t("auth.login.password")}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          placeholder={t("auth.login.passwordPlaceholder")}
          value={password}
          onChange={(event) => {
            if (error) clearError();
            setPassword(event.target.value);
          }}
          onKeyUp={trackCapsLock}
          onKeyDown={trackCapsLock}
          invalid={!!error}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
              className="pointer-events-auto text-text-faint transition-colors duration-[var(--t-fast)] hover:text-text"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
        />

        <AnimatePresence initial={false}>
          {capsLock && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center gap-1.5 overflow-hidden text-2xs text-warning"
            >
              <TriangleAlert className="size-3.5 shrink-0" />
              {t("auth.login.capsLockOn")}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={setRememberMe}
            label={t("auth.login.rememberMe")}
          />
          <button
            type="button"
            onClick={() => goToStep("recover")}
            className="text-xs font-medium text-accent-text transition-opacity duration-[var(--t-fast)] hover:opacity-75"
          >
            {t("auth.login.forgotPassword")}
          </button>
        </div>

        <Button type="submit" size="lg" className="group w-full" loading={busy}>
          <span>{t("auth.login.submit")}</span>
          <ArrowRight className="size-4 transition-transform duration-[var(--t-fast)] group-hover:translate-x-0.5" />
        </Button>
      </StepFrame>
    </>
  );
}
