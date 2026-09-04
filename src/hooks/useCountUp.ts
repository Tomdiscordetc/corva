import { useEffect, useState, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

/** Zählt eine Zahl von 0 zum Zielwert hoch. Respektiert reduzierte Bewegung. */
export function useCountUp(target: number, decimals = 0) {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    const from = first.current ? 0 : value;
    first.current = false;
    const controls = animate(from, target, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduceMotion]);

  return decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
}
