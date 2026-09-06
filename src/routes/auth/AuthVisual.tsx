import { useEffect, useState } from "react";
import { AtSign, MessageCircle, Phone, Radio } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/shell/Logo";
import { t } from "@/i18n";

/**
 * Zustand der Anmeldung, wie ihn das Markenfeld darstellt:
 * `idle` — Kanäle sind angebunden, aber noch nicht verbunden (rot),
 * `checking` — die Anmeldedaten werden geprüft (rot atmet),
 * `granted` — Zugang bestätigt: grün, Schloss öffnet und zerbricht.
 */
export type AuthPhase = "idle" | "checking" | "granted";

/** Zeitplan ab „Zugang bestätigt" in Millisekunden. */
export const GRANTED_STEPS = {
  lines: 0,
  lock: 700,
  shackle: 1500,
  burst: 1950,
  clear: 2300,
} as const;

/** Wie lange nach der Bestätigung gewartet wird, bevor das Dashboard kommt. */
export const AUTH_SEQUENCE_MS = 2600;

const channels = [
  { label: "E-Mail", Icon: AtSign, className: "left-2 top-4" },
  { label: "Telefon", Icon: Phone, className: "right-2 top-16" },
  { label: "WhatsApp", Icon: MessageCircle, className: "bottom-12 left-6" },
  { label: "Social", Icon: Radio, className: "bottom-3 right-8" },
] as const;

const connections = [
  "M58 38 C118 38 116 126 200 144",
  "M342 82 C286 82 284 126 200 144",
  "M78 236 C132 226 132 172 200 144",
  "M326 256 C270 238 272 174 200 144",
] as const;

/** Bruchstücke des Schlosses mit dem Winkel, in den sie davonfliegen. */
const shards = [
  { d: "M188 148h8", angle: -140 },
  { d: "M204 148h8", angle: -40 },
  { d: "M188 160h9", angle: 200 },
  { d: "M203 160h9", angle: 20 },
  { d: "M196 142h8", angle: -90 },
  { d: "M196 166h8", angle: 90 },
] as const;

const PENDING = "var(--color-auth-pending)";
const GRANTED = "var(--color-auth-granted)";

/**
 * Die vier Kontaktwege laufen im Corva-Signet zusammen. Beim Anmelden wird
 * daraus eine Kette: rot verbinden, prüfen, grün bestätigen, Schloss
 * aufbrechen.
 */
export function AuthVisual({ phase = "idle" }: { phase?: AuthPhase }) {
  const reduceMotion = useReducedMotion();
  const granted = phase === "granted";
  const [step, setStep] = useState<keyof typeof GRANTED_STEPS | null>(null);

  useEffect(() => {
    if (!granted) {
      setStep(null);
      return;
    }
    if (reduceMotion) {
      setStep("clear");
      return;
    }
    const timers = Object.entries(GRANTED_STEPS).map(([name, at]) =>
      window.setTimeout(() => setStep(name as keyof typeof GRANTED_STEPS), at),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [granted, reduceMotion]);

  const reached = (name: keyof typeof GRANTED_STEPS) =>
    step !== null && GRANTED_STEPS[step] >= GRANTED_STEPS[name];

  const lineColor = granted ? GRANTED : PENDING;
  const cleared = reached("clear");

  return (
    <div className="relative h-72 w-full max-w-lg" role="img" aria-label={t(`auth.visual.${phase}`)}>
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 288" fill="none" aria-hidden>
        {connections.map((d, index) => (
          <motion.path
            key={d}
            d={d}
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              // Beim Auflösen verschwinden die Linien nach innen.
              opacity: cleared ? 0 : phase === "checking" ? [1, 0.35, 1] : 1,
              stroke: lineColor,
            }}
            transition={{
              pathLength: {
                duration: reduceMotion ? 0 : 0.7,
                delay: reduceMotion ? 0 : 0.9 + index * 0.18,
                ease: [0.32, 0.72, 0, 1],
              },
              stroke: { duration: reduceMotion ? 0 : 0.38, delay: granted ? index * 0.12 : 0 },
              opacity:
                phase === "checking"
                  ? { duration: 1.8, repeat: Infinity, delay: index * 0.06, ease: "easeInOut" }
                  : { duration: reduceMotion ? 0 : 0.32 },
            }}
            style={{ filter: `drop-shadow(0 0 5px ${lineColor})` }}
          />
        ))}
      </svg>

      <motion.div
        className="absolute top-1/2 left-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-on-auth-brand/10 shadow-[var(--shadow-auth-mark)] backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
        animate={{
          opacity: cleared ? 0 : 1,
          scale: reached("lock") && !cleared ? [1, 1.08, 1] : 1,
          borderColor: granted ? GRANTED : "oklch(100% 0 0 / 0.15)",
        }}
        transition={{
          opacity: { duration: reduceMotion ? 0 : 0.32 },
          scale: { duration: 0.52, ease: [0.32, 0.72, 0, 1] },
          borderColor: { duration: 0.4 },
        }}
      >
        {/* Signet weicht dem Schloss, sobald der Zugang bestätigt ist. */}
        <motion.span
          animate={{ opacity: reached("lock") ? 0 : 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.32 }}
        >
          <Logo className="size-11 text-on-auth-brand" />
        </motion.span>

        <motion.svg
          viewBox="0 0 400 288"
          fill="none"
          aria-hidden
          className="absolute size-24 overflow-visible"
          animate={{ opacity: reached("lock") && !reached("burst") ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <motion.path
            d="M190 144v-4.5a10 10 0 0 1 20 0v4.5"
            stroke="var(--color-on-auth-brand)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transformOrigin: "186px 142px" }}
            animate={{ rotate: reached("shackle") ? -26 : 0, y: reached("shackle") ? -3 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.32, 0.72, 0, 1] }}
          />
          <rect
            x="186"
            y="144"
            width="28"
            height="22"
            rx="6"
            stroke="var(--color-on-auth-brand)"
            strokeWidth="3"
          />
          <path d="M200 152v5" stroke={GRANTED} strokeWidth="3" strokeLinecap="round" />
        </motion.svg>

        {/* Bruchstücke fliegen auseinander, wenn das Schloss aufbricht. */}
        <svg viewBox="0 0 400 288" fill="none" aria-hidden className="absolute size-24 overflow-visible">
          {shards.map((shard, index) => {
            const radians = (shard.angle * Math.PI) / 180;
            const distance = 46 + (index % 3) * 12;
            return (
              <motion.path
                key={shard.d}
                d={shard.d}
                stroke="var(--color-on-auth-brand)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={
                  reached("burst")
                    ? {
                        opacity: [1, 0],
                        x: Math.cos(radians) * distance,
                        y: Math.sin(radians) * distance,
                        rotate: index % 2 ? 90 : -90,
                      }
                    : { opacity: 0, x: 0, y: 0, rotate: 0 }
                }
                transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.2, 0.7, 0.3, 1] }}
              />
            );
          })}
        </svg>

        {/* Kurzer heller Schlag im Moment des Aufbrechens. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-8 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(100% 0 0 / 0.85), transparent 62%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reached("burst") && !cleared ? [0.55, 0] : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, ease: "easeOut" }}
        />
      </motion.div>

      {channels.map(({ label, Icon, className }, index) => (
        <motion.div
          key={label}
          aria-hidden
          className={`absolute ${className} flex items-center gap-2 rounded-full border border-on-auth-brand/15 bg-on-auth-brand/10 py-2 pr-3 pl-2 text-xs font-medium text-on-auth-brand/85 shadow-[var(--shadow-soft)] backdrop-blur-md`}
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{
            opacity: cleared ? 0 : 1,
            y: reduceMotion || phase !== "idle" ? 0 : [0, -3, 0],
            scale: 1,
          }}
          transition={{
            opacity: { duration: reduceMotion ? 0 : 0.6, delay: cleared ? 0 : reduceMotion ? 0 : 0.12 + index * 0.16 },
            scale: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.12 + index * 0.16 },
            y:
              phase === "idle" && !reduceMotion
                ? { duration: 5.2 + index * 0.35, delay: 1.6 + index * 0.16, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 },
          }}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-on-auth-brand/10">
            <Icon className="size-3.5 text-accent" />
          </span>
          {label}
        </motion.div>
      ))}
    </div>
  );
}
