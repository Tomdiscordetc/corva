import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

/**
 * Kurzmeldungen unten rechts, im gleichen Kartenstil wie der Rest der
 * Oberfläche. Der Umschluss hält Sonner an einer Stelle austauschbar.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-3 rounded-md border border-line bg-surface-raised px-4 py-3 text-sm text-text shadow-[var(--shadow-overlay)] w-[min(360px,calc(100vw-2rem))]",
          title: "font-medium",
          description: "text-text-muted",
        },
      }}
    />
  );
}
