import { motion } from "motion/react";
import type { PipelineStage } from "@/demo/dashboard";
import { t } from "@/i18n";

const STAGE_COLORS: Record<PipelineStage["key"], string> = {
  new: "bg-line-strong",
  contacted: "bg-text-faint",
  consultation: "bg-text-muted",
  offer: "bg-accent",
  won: "bg-positive",
};

export function PipelineOverview({ stages }: { stages: PipelineStage[] }) {
  const total = Math.max(stages.reduce((sum, s) => sum + s.count, 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        {stages.map((stage) => (
          <motion.div
            key={stage.key}
            className={STAGE_COLORS[stage.key]}
            initial={{ width: 0 }}
            animate={{ width: `${(stage.count / total) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stages.map((stage) => (
          <div key={stage.key} className="space-y-1">
            <dt className="flex items-center gap-1.5 text-2xs text-text-muted">
              <span className={`size-2 rounded-full ${STAGE_COLORS[stage.key]}`} />
              {t(`dashboard.pipeline.stages.${stage.key}`)}
            </dt>
            <dd className="tabular-nums text-lg font-semibold text-text">{stage.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
