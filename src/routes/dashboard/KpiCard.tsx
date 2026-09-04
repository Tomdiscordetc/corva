import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Card, CardContent } from "@/components/ui/Card";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  delta: number | null;
  format?: "number" | "percent";
}

export function KpiCard({ icon: Icon, label, value, delta, format = "number" }: KpiCardProps) {
  const animated = useCountUp(format === "percent" ? value * 100 : value, 0);
  const display = format === "percent" ? `${animated}%` : animated.toLocaleString("de-DE");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">{label}</span>
          <div className="flex size-8 items-center justify-center rounded-md bg-surface-muted text-text-muted">
            <Icon className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tabular-nums text-2xl font-semibold text-text">{display}</span>
          {delta !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                delta >= 0 ? "text-positive" : "text-danger",
              )}
            >
              {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {Math.abs(Math.round(delta * 100))}%
            </span>
          )}
        </div>
        {delta !== null && <span className="text-2xs text-text-faint">{t("dashboard.kpi.vsLastWeek")}</span>}
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 rounded-md bg-skeleton animate-pulse" />
          <div className="size-8 rounded-md bg-skeleton animate-pulse" />
        </div>
        <div className="h-7 w-16 rounded-md bg-skeleton animate-pulse" />
        <div className="h-3 w-24 rounded-md bg-skeleton animate-pulse" />
      </CardContent>
    </Card>
  );
}
