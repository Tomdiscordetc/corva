import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { t } from "@/i18n";

const DRAW: [string, string][] = [
  [
    "M28 10.5C25.8 8.3 22.9 7 19.7 7 12.7 7 7 12.7 7 19.7s5.7 12.7 12.7 12.7c3.2 0 6.1-1.2 8.3-3.2",
    "var(--color-neutral-950)",
  ],
  [
    "M13 21.3c1.9 3.6 5.7 6 10 6 6.2 0 11.3-5.1 11.3-11.3S29.2 4.7 23 4.7c-2.8 0-5.4 1-7.4 2.8",
    "var(--color-accent)",
  ],
];

/**
 * Marken-Startbildschirm: erscheint nur beim Kaltstart der Sitzung
 * (sessionStorage-Flag), nicht bei jedem Login. Signet zeichnet sich selbst,
 * dann Übergabe an die Anmeldung.
 */
export function SplashScreen() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem("corva.splash-seen", "1");
      navigate("/login", { replace: true });
    }, 1400);
    const readyTimer = setTimeout(() => setReady(true), 50);
    return () => {
      clearTimeout(timer);
      clearTimeout(readyTimer);
    };
  }, [navigate]);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-surface-sunken">
      <svg viewBox="0 0 40 40" fill="none" className="size-16">
        {DRAW.map(([d, stroke], i) => (
          <motion.path
            key={i}
            d={d}
            stroke={stroke}
            strokeWidth="3.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={ready ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1], delay: i * 0.12 }}
          />
        ))}
      </svg>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-sm font-medium tracking-wide text-text-muted"
      >
        {t("app.name")}
      </motion.p>
    </div>
  );
}
