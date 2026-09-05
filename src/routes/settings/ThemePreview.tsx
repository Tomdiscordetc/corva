import { cn } from "@/lib/cn";
import type { ThemeChoice } from "@/store/theme";

function MiniWindow({ dark }: { dark: boolean }) {
  return (
    <div className={cn("flex h-full overflow-hidden rounded-sm border shadow-[var(--shadow-soft)]", dark ? "border-neutral-700 bg-neutral-950" : "border-neutral-200 bg-neutral-0")}>
      <div className={cn("flex w-8 shrink-0 flex-col items-center gap-2 border-r py-3", dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-150 bg-neutral-50")}>
        <span className="mb-1 size-3 rounded-sm bg-accent" />
        {[0, 1, 2].map((n) => <span key={n} className={cn("size-2 rounded-sm", dark ? "bg-neutral-600" : "bg-neutral-300")} />)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className={cn("mb-1 h-2 w-1/2 rounded-full", dark ? "bg-neutral-400" : "bg-neutral-500")} />
        <div className="grid grid-cols-2 gap-2">
          <div className={cn("h-7 rounded-sm border", dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-150 bg-neutral-50")} />
          <div className={cn("h-7 rounded-sm border", dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-150 bg-neutral-50")} />
        </div>
        <div className={cn("h-2 w-4/5 rounded-full", dark ? "bg-neutral-800" : "bg-neutral-150")} />
        <div className={cn("h-2 w-3/5 rounded-full", dark ? "bg-neutral-800" : "bg-neutral-150")} />
      </div>
    </div>
  );
}

/** Absichtlich feste Neutral-Tokens: zeigt Hell/Dunkel unabhängig vom aktiven Theme. */
export function ThemePreview({ theme }: { theme: ThemeChoice }) {
  return (
    <div aria-hidden className="relative h-32 overflow-hidden rounded-md bg-surface-muted p-3">
      <MiniWindow dark={theme === "dark"} />
      {theme === "system" && (
        <div className="absolute inset-3 [clip-path:inset(0_0_0_50%)]">
          <MiniWindow dark />
        </div>
      )}
    </div>
  );
}
