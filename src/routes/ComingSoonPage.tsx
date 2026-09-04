import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/** Platzhalter für Bereiche, die erst in einem späteren Abschnitt gebaut werden. */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-100 items-center justify-center">
      <EmptyState
        icon={<Construction className="size-5" />}
        title={title}
        description="Dieser Bereich folgt in einem späteren Bauabschnitt."
      />
    </div>
  );
}
