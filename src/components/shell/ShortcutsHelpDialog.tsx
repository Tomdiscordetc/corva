import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useUiStore } from "@/store/ui";
import { getNavItems } from "./navItems";
import { t } from "@/i18n";

const GO_KEYS: Record<string, string> = {
  "/app": "d",
  "/app/contacts": "c",
  "/app/inbox": "i",
  "/app/calendar": "k",
  "/app/tasks": "a",
  "/app/reports": "r",
  "/app/settings": "e",
};

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="rounded-[6px] border border-line-strong bg-surface-sunken px-1.5 py-0.5 text-2xs font-medium text-text"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function ShortcutsHelpDialog() {
  const open = useUiStore((s) => s.shortcutsHelpOpen);
  const setOpen = useUiStore((s) => s.setShortcutsHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title={t("shortcuts.title")} description={t("shortcuts.subtitle")} className="w-[min(420px,calc(100vw-2rem))]">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text">{t("commandPalette.placeholder")}</span>
            <Keys keys={["Strg", "K"]} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text">{t("shortcuts.openHelp")}</span>
            <Keys keys={["?"]} />
          </div>
          <div className="border-t border-line pt-3">
            <p className="mb-2 text-2xs font-medium text-text-faint">{t("shortcuts.goTo")}</p>
            <ul className="space-y-2">
              {getNavItems().map((item) => (
                <li key={item.path} className="flex items-center justify-between text-sm">
                  <span className="text-text">{item.label}</span>
                  <Keys keys={["g", GO_KEYS[item.path] ?? "?"]} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
