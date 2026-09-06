import { useEffect, useState } from "react";
import { AtSign, MessageCircle, Phone, Radio } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/shell/Logo";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

/**
 * Zustand der Anmeldung, wie ihn das Markenfeld darstellt:
 * `idle` — Kanäle sind angebunden, aber noch nicht verbunden (rot),
 * `checking` — die Anmeldedaten werden geprüft (rot atmet),
 * `granted` — Zugang bestätigt: Grün fließt ein, Schloss öffnet und zerbricht.
 */
export type AuthPhase = "idle" | "checking" | "granted";

/** Zeitplan ab „Zugang bestätigt" in Millisekunden. */
export const GRANTED_STEPS = {
  lines: 0,
  lock: 1000,
  shackle: 1800,
  burst: 2300,
  clear: 2700,
} as const;

/** Wie lange nach der Bestätigung gewartet wird, bevor das Dashboard kommt. */
export const AUTH_SEQUENCE_MS = 3000;

const channels = [
  { label: "E-Mail", Icon: AtSign, className: "left-2 top-4" },
  { label: "Telefon", Icon: Phone, className: "right-2 top-16" },
  { label: "WhatsApp", Icon: MessageCircle, className: "bottom-12 left-6" },
  { label: "Social", Icon: Radio, className: "bottom-3 right-8" },
] as const;

/** Jeder Pfad startet am Kanal und endet in der Mitte — die Fließrichtung. */
const connections = [
  "M58 38 C118 38 116 126 200 144",
  "M342 82 C286 82 284 126 200 144",
  "M78 236 C132 226 132 172 200 144",
  "M326 256 C270 238 272 174 200 144",
] as const;

/** Bruchstücke des Schlosses mit dem Winkel, in den sie davonfliegen. */
const shards = [
  { d: "M14 20h7", angle: -150 },
  { d: "M27 20h7", angle: -30 },
  { d: "M13 30h8", angle: 195 },
  { d: "M27 30h8", angle: 15 },
  { d: "M20 12h8", angle: -90 },
  { d: "M20 37h8", angle: 90 },
] as const;

const PENDING = "var(--color-auth-pending)";
const GRANTED = "var(--color-auth-granted)";

/**
 * Die vier Kontaktwege laufen im Corva-Signet zusammen. Beim Anmelden wird
 * daraus eine Kette: rot verbinden, prüfen, Grün einfließen lassen, Schloss
 * aufbrechen. Während der Anmeldung wächst die Darstellung, weil das
 * Markenfeld dann die ganze Breite einnimmt.
 */
export function AuthVisual({ phase = "idle" }: { phase?: AuthPhase }) {
  const reduceMotion = useReducedMotion();
  const granted = phase === "granted";
  const active = phase !== "idle";
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
  const cleared = reached("clear");

  return (
    <div
      role="img"
      aria-label={t(`auth.visual.${phase}`)}
      className={cn(
        "relative w-full transition-[height,max-width] duration-[var(--t-auth-swipe)] ease-[var(--ease-standard)]",
        active ? "h-[26rem] max-w-3xl" : "h-72 max-w-lg",
      )}
    >
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 400 288" fill="none" aria-hidden>
        {connections.map((d, index) => (
          <g key={d}>
            {/* Grundzustand: rot = angebunden, aber noch nicht verbunden. */}
            <motion.path
              d={d}
              stroke={PENDING}
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: cleared ? 0 : granted ? 0.25 : phase === "checking" ? [1, 0.35, 1] : 1,
              }}
              transition={{
                pathLength: {
                  duration: reduceMotion ? 0 : 0.7,
                  delay: reduceMotion ? 0 : 0.9 + index * 0.18,
                  ease: [0.32, 0.72, 0, 1],
                },
                opacity:
                  phase === "checking"
                    ? { duration: 1.8, repeat: Infinity, delay: index * 0.06, ease: "easeInOut" }
                    : { duration: reduceMotion ? 0 : 0.4 },
              }}
              style={{ filter: `drop-shadow(0 0 5px ${PENDING})` }}
            />

            {/* Grün fließt vom Kanal zur Mitte und bleibt als Spur stehen. */}
            <motion.path
              d={d}
              stroke={GRANTED}
              strokeWidth="2.4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: granted ? 1 : 0,
                opacity: cleared ? 0 : granted ? 1 : 0,
              }}
              transition={{
                pathLength: { duration: reduceMotion ? 0 : 0.9, delay: granted ? index * 0.14 : 0, ease: [0.32, 0.72, 0, 1] },
                opacity: { duration: reduceMotion ? 0 : 0.25, delay: granted && !cleared ? index * 0.14 : 0 },
              }}
              style={{ filter: `drop-shadow(0 0 7px ${GRANTED})` }}
            />

            {/* Der leuchtende Tropfen an der Spitze der einlaufenden Farbe. */}
            {granted && !cleared && !reduceMotion && (
              <circle
                r="4"
                fill={GRANTED}
                className="auth-flow-drop"
                style={{
                  offsetPath: `path("${d}")`,
                  animationDelay: `${index * 140}ms`,
                  filter: `drop-shadow(0 0 8px ${GRANTED})`,
                }}
              />
            )}
          </g>
        ))}
      </svg>

      <motion.div
        className={cn(
          "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          "rounded-full border bg-on-auth-brand/10 shadow-[var(--shadow-auth-mark)] backdrop-blur-md",
          "transition-[width,height] duration-[var(--t-auth-swipe)] ease-[var(--ease-standard)]",
          active ? "size-36" : "size-24",
        )}
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
          animate={{ opacity: reached("lock") ? 0 : 1, scale: reached("lock") ? 0.8 : 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.32 }}
        >
          <Logo className={cn("text-on-auth-brand transition-[width,height]", active ? "size-16" : "size-11")} />
        </motion.span>

        {/*
          Eigene Koordinatenfläche: mit der viewBox der Gesamtgrafik wäre das
          Schloss auf wenige Pixel geschrumpft und praktisch unsichtbar.
        */}
        <motion.svg
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden
          className={cn("absolute overflow-visible transition-[width,height]", active ? "size-24" : "size-16")}
          animate={{
            opacity: reached("lock") && !reached("burst") ? 1 : 0,
            scale: reached("lock") ? 1 : 0.85,
          }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
        >
          <motion.path
            d="M15 21v-5.5a9 9 0 0 1 18 0V21"
            stroke="var(--color-on-auth-brand)"
            strokeWidth="3.4"
            strokeLinecap="round"
            style={{ transformOrigin: "15px 21px" }}
            animate={{ rotate: reached("shackle") ? -28 : 0, y: reached("shackle") ? -2 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.32, 0.72, 0, 1] }}
          />
          <rect
            x="10"
            y="21"
            width="28"
            height="21"
            rx="6"
            stroke="var(--color-on-auth-brand)"
            strokeWidth="3.4"
          />
          <path d="M24 29v5" stroke={GRANTED} strokeWidth="3.4" strokeLinecap="round" />
        </motion.svg>

        {/* Bruchstücke fliegen auseinander, wenn das Schloss aufbricht. */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden
          className={cn("absolute overflow-visible transition-[width,height]", active ? "size-24" : "size-16")}
        >
          {shards.map((shard, index) => {
            const radians = (shard.angle * Math.PI) / 180;
            const distance = 26 + (index % 3) * 7;
            return (
              <motion.path
                key={shard.d}
                d={shard.d}
                stroke="var(--color-on-auth-brand)"
                strokeWidth="2.6"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={
                  reached("burst")
                    ? {
                        opacity: [1, 0],
                        x: Math.cos(radians) * distance,
                        y: Math.sin(radians) * distance,
                        rotate: index % 2 ? 80 : -80,
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
          className="pointer-events-none absolute -inset-10 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(100% 0 0 / 0.85), transparent 62%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reached("burst") && !cleared ? [0.6, 0] : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, ease: "easeOut" }}
        />
      </motion.div>

      {channels.map(({ label, Icon, className }, index) => (
        <motion.div
          key={label}
          aria-hidden
          className={cn(
            "absolute flex items-center gap-2 rounded-full border border-on-auth-brand/15 bg-on-auth-brand/10",
            "font-medium text-on-auth-brand/85 shadow-[var(--shadow-soft)] backdrop-blur-md",
            "transition-[padding,font-size] duration-[var(--t-auth-swipe)] ease-[var(--ease-standard)]",
            active ? "py-2.5 pr-4 pl-2.5 text-sm" : "py-2 pr-3 pl-2 text-xs",
            className,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{
            opacity: cleared ? 0 : 1,
            y: reduceMotion || active ? 0 : [0, -3, 0],
            scale: 1,
          }}
          transition={{
            opacity: { duration: reduceMotion ? 0 : 0.6, delay: cleared ? 0 : reduceMotion ? 0 : 0.12 + index * 0.16 },
            scale: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.12 + index * 0.16 },
            y: !active && !reduceMotion
              ? { duration: 5.2 + index * 0.35, delay: 1.6 + index * 0.16, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 },
          }}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-on-auth-brand/10 transition-[width,height]",
              active ? "size-8" : "size-7",
            )}
          >
            <Icon className={cn("text-accent transition-[width,height]", active ? "size-4" : "size-3.5")} />
          </span>
          {label}
        </motion.div>
      ))}
    </div>
  );
}
