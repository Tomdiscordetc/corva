import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHANNEL_CONFIG } from "./channels";
import type { ActivityItem } from "@/demo/dashboard";
import { t } from "@/i18n";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.round(hours / 24)} Tg.`;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<Activity className="size-5" />} title={t("dashboard.activity.empty")} />;
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const channel = CHANNEL_CONFIG[item.channel];
        return (
          <li key={item.id} className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors duration-[var(--t-fast)] hover:bg-neutral-50">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${channel.tone}`}>
              <channel.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">
                <span className="font-medium">{item.contactName}</span> · {item.description}
              </p>
              <p className="text-2xs text-text-faint">{channel.label} · {relativeTime(item.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
