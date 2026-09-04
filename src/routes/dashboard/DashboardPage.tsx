import { Users, UserCheck, Trophy, Percent, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardHeader, CardTitle, CardSubtitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { KpiCard, KpiCardSkeleton } from "./KpiCard";
import { TrendChart } from "./TrendChart";
import { PipelineOverview } from "./PipelineOverview";
import { TodayTasks } from "./TodayTasks";
import { RecentActivity } from "./RecentActivity";
import { t } from "@/i18n";

export function DashboardPage() {
  const { data, isPending, isError, refetch, isRefetching } = useDashboardData();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{t("dashboard.title")}</h1>
          {data ? (
            <p className="text-sm text-text-muted">{t("dashboard.subtitle", { team: data.team })}</p>
          ) : isPending ? (
            <Skeleton className="mt-1.5 h-4 w-40" />
          ) : null}
        </div>
        <StatusPill tone="neutral">{t("dashboard.demoNotice")}</StatusPill>
      </div>

      {isError ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-danger-tint text-danger">
                <AlertTriangle className="size-5" />
              </div>
              <p className="text-sm font-medium text-text">{t("dashboard.error.title")}</p>
              <Button size="sm" variant="secondary" onClick={() => refetch()} loading={isRefetching}>
                {t("dashboard.error.retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isPending ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <motion.div
                className="contents"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              >
                {[
                  { icon: Users, label: t("dashboard.kpi.newLeads"), value: data!.kpi.newLeads, delta: data!.kpi.newLeadsDelta },
                  { icon: UserCheck, label: t("dashboard.kpi.openConsultations"), value: data!.kpi.openConsultations, delta: data!.kpi.openConsultationsDelta },
                  { icon: Trophy, label: t("dashboard.kpi.closedDeals"), value: data!.kpi.closedDeals, delta: data!.kpi.closedDealsDelta },
                  { icon: Percent, label: t("dashboard.kpi.conversionRate"), value: data!.kpi.conversionRate, delta: data!.kpi.conversionRateDelta, format: "percent" as const },
                ].map((kpi) => (
                  <motion.div
                    key={kpi.label}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  >
                    <KpiCard {...kpi} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>{t("dashboard.trend.title")}</CardTitle>
                  <CardSubtitle>{t("dashboard.trend.subtitle")}</CardSubtitle>
                </div>
              </CardHeader>
              <CardContent>
                {isPending ? <Skeleton className="h-40 w-full" /> : <TrendChart data={data!.trend} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.tasks.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <TodayTasks tasks={data!.tasks} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>{t("dashboard.pipeline.title")}</CardTitle>
                  <CardSubtitle>{t("dashboard.pipeline.subtitle")}</CardSubtitle>
                </div>
              </CardHeader>
              <CardContent>
                {isPending ? <Skeleton className="h-16 w-full" /> : <PipelineOverview stages={data!.pipeline} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.activity.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <RecentActivity items={data!.activity} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
