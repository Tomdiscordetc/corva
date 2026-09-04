import { useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Checkbox } from "@/components/ui/Checkbox";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusPill } from "@/components/ui/StatusPill";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/Dialog";
import { Tooltip } from "@/components/ui/Tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { toast } from "@/components/ui/Toast";
import { t } from "@/i18n";

/*
  Tailwind erkennt nur Klassennamen, die als vollständige Zeichenkette im
  Quelltext stehen — ein per Template-String zusammengesetztes "bg-${tok}"
  würde nicht erzeugt. Deshalb hier feste Zuordnungen statt Interpolation.
*/
const NEUTRAL_SWATCHES: { name: string; className: string }[] = [
  { name: "0", className: "bg-neutral-0" },
  { name: "25", className: "bg-neutral-25" },
  { name: "50", className: "bg-neutral-50" },
  { name: "100", className: "bg-neutral-100" },
  { name: "150", className: "bg-neutral-150" },
  { name: "200", className: "bg-neutral-200" },
  { name: "300", className: "bg-neutral-300" },
  { name: "400", className: "bg-neutral-400" },
  { name: "500", className: "bg-neutral-500" },
  { name: "600", className: "bg-neutral-600" },
  { name: "700", className: "bg-neutral-700" },
  { name: "800", className: "bg-neutral-800" },
  { name: "900", className: "bg-neutral-900" },
  { name: "950", className: "bg-neutral-950" },
  { name: "1000", className: "bg-neutral-1000" },
];
const ACCENT_SWATCHES: { name: string; className: string }[] = [
  { name: "accent-tint", className: "bg-accent-tint" },
  { name: "accent-subtle", className: "bg-accent-subtle" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-hover", className: "bg-accent-hover" },
  { name: "active", className: "bg-active" },
];
const STATUS_SWATCHES: { name: string; className: string }[] = [
  { name: "Positiv", className: "bg-positive" },
  { name: "Warnung", className: "bg-warning" },
  { name: "Gefahr", className: "bg-danger" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-14 rounded-md border border-line ${className}`} />
      <p className="text-2xs text-text-faint">{name}</p>
    </div>
  );
}

export function StyleguidePage() {
  const [density, setDensity] = useState<"a" | "b">("a");
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(true);

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">
      <div>
        <h1 className="text-xl font-semibold text-text">{t("styleguide.title")}</h1>
        <p className="mt-1 max-w-xl text-sm text-text-muted">{t("styleguide.subtitle")}</p>
      </div>

      <Section title={t("styleguide.colors.title")}>
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">{t("styleguide.colors.neutral")}</p>
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
              {NEUTRAL_SWATCHES.map((sw) => (
                <Swatch key={sw.name} name={sw.name} className={sw.className} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">{t("styleguide.colors.accent")}</p>
            <div className="grid grid-cols-5 gap-3">
              {ACCENT_SWATCHES.map((sw) => (
                <Swatch key={sw.name} name={sw.name} className={sw.className} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">{t("styleguide.colors.status")}</p>
            <div className="grid grid-cols-3 gap-3 sm:w-1/2">
              {STATUS_SWATCHES.map((sw) => (
                <Swatch key={sw.name} name={sw.name} className={sw.className} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title={t("styleguide.typography.title")}>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-2xl font-semibold text-text">{t("styleguide.typography.sample")}</p>
            <p className="text-xl font-semibold text-text">{t("styleguide.typography.sample")}</p>
            <p className="text-lg font-semibold text-text">{t("styleguide.typography.sample")}</p>
            <p className="text-base text-text">{t("styleguide.typography.sample")}</p>
            <p className="text-sm text-text">{t("styleguide.typography.sample")}</p>
            <p className="text-xs text-text-muted">{t("styleguide.typography.sample")}</p>
            <p className="text-2xs text-text-faint">{t("styleguide.typography.sample")}</p>
          </CardContent>
        </Card>
      </Section>

      <Section title={t("styleguide.motion.title")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ["fast", t("styleguide.motion.fast")],
              ["base", t("styleguide.motion.base")],
              ["slow", t("styleguide.motion.slow")],
              ["page", t("styleguide.motion.page")],
            ] as const
          ).map(([key, label]) => (
            <Card key={key}>
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <div
                  className="size-8 rounded-full bg-accent transition-transform hover:scale-150"
                  style={{ transitionDuration: `var(--t-${key})`, transitionTimingFunction: "var(--ease-standard)" }}
                />
                <p className="text-2xs text-text-faint">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t("styleguide.components.title")}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("styleguide.components.buttons")}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primär</Button>
              <Button variant="secondary">Sekundär</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Gefahr</Button>
              <Button variant="primary" loading>Lädt</Button>
              <Button variant="primary" disabled>Deaktiviert</Button>
              <Button variant="secondary" size="sm">Klein</Button>
              <Button variant="secondary" size="lg">Groß</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("styleguide.components.inputs")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Input label="Standard" placeholder="Text eingeben" />
              <Input label="Mit Symbol" placeholder="E-Mail" trailing={<Mail className="size-4" />} />
              <Input label="Fehler" placeholder="Text eingeben" error="Pflichtfeld ausfüllen" />
              <Input label="Deaktiviert" placeholder="Text eingeben" disabled />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("styleguide.components.toggles")}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6">
              <Switch checked={switched} onCheckedChange={setSwitched} label="Schalter" />
              <Checkbox checked={checked} onCheckedChange={setChecked} label="Kontrollkästchen" />
              <SegmentedControl
                aria-label="Beispiel"
                value={density}
                onChange={setDensity}
                options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]}
              />
              <Avatar name="Sabine Krüger" size="sm" />
              <Avatar name="Mehmet Aydın" size="md" />
              <Avatar name="Julia Bergmann" size="lg" />
              <StatusPill tone="accent">Neu</StatusPill>
              <StatusPill tone="positive">Aktiv</StatusPill>
              <StatusPill tone="warning">Wartet</StatusPill>
              <StatusPill tone="danger">Fehler</StatusPill>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Reiter</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="a">
                <TabsList>
                  <TabsTrigger value="a">Übersicht</TabsTrigger>
                  <TabsTrigger value="b">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="a" className="pt-3 text-sm text-text-muted">Inhalt A</TabsContent>
                <TabsContent value="b" className="pt-3 text-sm text-text-muted">Inhalt B</TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Skelett &amp; Leerzustand</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
              <EmptyState icon={<Trash2 className="size-5" />} title="Nichts gefunden" description="Beispieltext für einen Leerzustand." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("styleguide.components.overlays")}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">{t("styleguide.components.openDialog")}</Button>
                </DialogTrigger>
                <DialogContent title="Beispieldialog" description="Ein kurzer Beschreibungstext.">
                  <Button variant="primary" className="w-full">Bestätigen</Button>
                </DialogContent>
              </Dialog>

              <Button
                variant="secondary"
                onClick={() =>
                  toast(t("styleguide.components.toastTitle"), {
                    description: t("styleguide.components.toastDescription"),
                  })
                }
              >
                {t("styleguide.components.showToast")}
              </Button>

              <Tooltip content="Das ist eine Kurzinfo">
                <Button variant="ghost">Hover mich</Button>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">Menü</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Option eins</DropdownMenuItem>
                  <DropdownMenuItem>Option zwei</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
