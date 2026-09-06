import { useId, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { t } from "@/i18n";

export function SettingsGroup({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const id = useId();
  return <Card role="group" aria-labelledby={id} className="overflow-hidden shadow-none">
    <div className="border-b border-line px-5 py-4 sm:px-6">
      <h3 id={id} className="text-sm font-semibold text-text">{title}</h3>
      {subtitle && <p className="mt-1 text-xs leading-relaxed text-text-muted">{subtitle}</p>}
    </div>
    {children}
  </Card>;
}

export function SettingsFeedback({ error, success }: { error?: string | null; success?: string | null }) {
  return <>
    {error && <p role="alert" className="rounded-md border border-danger/20 bg-danger-tint p-4 text-xs leading-relaxed text-danger">{error}</p>}
    {success && <p role="status" className="rounded-md border border-positive/20 bg-positive-tint p-4 text-xs leading-relaxed text-text">{success}</p>}
  </>;
}

/** A bounded, keyboard-accessible dialog; recovery codes require acknowledgement. */
export function SettingsDialog({ open, onClose, canClose = true, title, description, children }: {
  open: boolean;
  onClose: () => void;
  canClose?: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return <RadixDialog.Root open={open} onOpenChange={(next) => { if (!next && canClose) onClose(); }}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-scrim" />
      <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-var(--spacing)*8)] w-[calc(100%-var(--spacing)*8)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-surface-raised p-6 shadow-[var(--shadow-overlay)] outline-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <RadixDialog.Title className="text-base font-semibold text-text">{title}</RadixDialog.Title>
            <RadixDialog.Description className="mt-2 text-xs leading-relaxed text-text-muted">{description}</RadixDialog.Description>
          </div>
          {canClose && <RadixDialog.Close asChild><button type="button" aria-label={t("serverSettings.close")} className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover"><X className="size-4" aria-hidden /></button></RadixDialog.Close>}
        </div>
        <div className="mt-5 space-y-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>;
}
