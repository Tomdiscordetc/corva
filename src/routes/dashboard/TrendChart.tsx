import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import type { TrendPoint } from "@/demo/dashboard";

interface TrendChartProps {
  data: TrendPoint[];
  width?: number;
  height?: number;
}

/** Eigenes, leichtgewichtiges SVG-Liniendiagramm statt einer Chart-Bibliothek. */
export function TrendChart({ data, width = 560, height = 160 }: TrendChartProps) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const padding = 8;

  const { linePath, areaPath, points } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    const stepX = (width - padding * 2) / (data.length - 1);
    const pts = data.map((d, i) => ({
      x: padding + i * stepX,
      y: height - padding - (d.count / max) * (height - padding * 2),
      count: d.count,
      date: d.date,
    }));
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${pts[pts.length - 1]!.x},${height} L${pts[0]!.x},${height} Z`;
    return { linePath: line, areaPath: area, points: pts };
  }, [data, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Verlauf neuer Anfragen der letzten 14 Tage">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3.5 : 0}
          fill="var(--color-accent)"
        />
      ))}
    </svg>
  );
}
