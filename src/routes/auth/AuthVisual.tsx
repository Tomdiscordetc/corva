import { AtSign, MessageCircle, Phone, Radio } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/shell/Logo";

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

/** Vier Kontaktwege laufen im Corva-Signet zusammen. */
export function AuthVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative h-72 w-full max-w-lg" aria-hidden>
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 288" fill="none">
        {connections.map((d, index) => (
          <motion.path
            key={d}
            d={d}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 7"
            className="text-on-auth-brand/20"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.8,
              delay: reduceMotion ? 0 : 0.35 + index * 0.12,
              ease: [0.32, 0.72, 0, 1],
            }}
          />
        ))}
      </svg>

      <motion.div
        className="absolute top-1/2 left-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-on-auth-brand/15 bg-on-auth-brand/10 shadow-[var(--shadow-auth-mark)] backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, delay: 0.18, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.span
          className="absolute inset-2 rounded-full border border-accent/40"
          animate={reduceMotion ? undefined : { scale: [0.92, 1.06, 0.92], opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <Logo className="relative size-11 text-on-auth-brand" />
      </motion.div>

      {channels.map(({ label, Icon, className }, index) => (
        <motion.div
          key={label}
          className={`absolute ${className} flex items-center gap-2 rounded-full border border-on-auth-brand/15 bg-on-auth-brand/10 py-2 pr-3 pl-2 text-xs font-medium text-on-auth-brand/85 shadow-[var(--shadow-soft)] backdrop-blur-md`}
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.55 + index * 0.1 }}
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
