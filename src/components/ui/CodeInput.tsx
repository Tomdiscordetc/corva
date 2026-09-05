import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Wird ausgelöst, sobald alle Stellen gefüllt sind. */
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  label: string;
  autoFocus?: boolean;
}

/**
 * Ziffernfelder für Bestätigungscodes. Bewusst **ein** Eingabefeld hinter
 * sechs Anzeigekästchen statt sechs echter Felder: nur so funktionieren
 * schnelles Tippen, Einfügen, Passwortmanager und der SMS-Code-Vorschlag des
 * Handys zuverlässig — bei sechs Feldern gehen Zeichen beim Fokuswechsel
 * verloren.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  invalid = false,
  disabled = false,
  label,
  autoFocus = false,
}: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const completedFor = useRef<string | null>(null);
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const caretIndex = Math.min(value.length, length - 1);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && completedFor.current !== value) {
      completedFor.current = value;
      onComplete?.(value);
    }
    if (value.length < length) completedFor.current = null;
  }, [length, onComplete, value]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="code-input" className="text-xs font-medium text-text-muted">
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="code-input"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          aria-invalid={invalid}
          /* Unsichtbar, aber bedienbar: fängt Tastatur, Einfügen und Autofill ab. */
          className="absolute inset-0 z-10 w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
        />

        <motion.div
          aria-hidden
          className="flex gap-2"
          animate={invalid && !reduceMotion ? { x: [0, -5, 4, -2, 0] } : { x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {digits.map((digit, index) => {
            const active = focused && !disabled && index === caretIndex;
            return (
              <div
                key={index}
                className={cn(
                  "flex h-14 flex-1 items-center justify-center rounded-md border bg-surface text-lg font-semibold text-text tabular-nums",
                  "transition-[border-color,box-shadow,transform] duration-[var(--t-fast)] ease-[var(--ease-standard)]",
                  digit ? "border-accent/40" : "border-line-strong",
                  active && "scale-[1.04] border-accent ring-4 ring-accent-tint",
                  invalid && "border-danger",
                  disabled && "opacity-50",
                )}
              >
                {digit ? (
                  <motion.span
                    initial={reduceMotion ? false : { opacity: 0, y: 4, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.32, 0.72, 0, 1] }}
                  >
                    {digit}
                  </motion.span>
                ) : (
                  active && (
                    <motion.span
                      className="h-6 w-px bg-accent"
                      animate={reduceMotion ? undefined : { opacity: [1, 0.15, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
