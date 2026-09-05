import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LogoLockup } from "@/components/shell/Logo";
import { t } from "@/i18n";

interface LegalSection {
  heading: string;
  body: string;
}

/**
 * Gerüst für die gesetzlichen Pflichtseiten. Die Inhalte trägt der Betreiber
 * vor dem Verkaufsstart ein — hier steht bewusst kein erfundener Text, der
 * für eine fertige Angabe gehalten werden könnte (REGELN.md Punkt 5).
 */
function LegalPage({ titleKey, sections }: { titleKey: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-dvh bg-surface-sunken px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/login"
          className="group mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors duration-[var(--t-fast)] hover:text-text"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-[var(--t-fast)] group-hover:-translate-x-0.5" />
          {t("legal.back")}
        </Link>

        <LogoLockup className="mb-8 text-text" />

        <h1 className="text-2xl font-semibold tracking-tight text-text">{t(titleKey)}</h1>

        <p className="mt-4 rounded-md border border-warning/20 bg-warning-tint px-4 py-3 text-sm text-text">
          {t("legal.placeholderNotice")}
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-sm font-semibold text-text">{t(section.heading)}</h2>
              <p className="mt-1.5 text-sm whitespace-pre-line text-text-muted">{t(section.body)}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

/** Anbieterkennzeichnung nach § 5 DDG. */
export function ImprintPage() {
  return (
    <LegalPage
      titleKey="legal.imprint.title"
      sections={[
        { heading: "legal.imprint.providerHeading", body: "legal.imprint.provider" },
        { heading: "legal.imprint.contactHeading", body: "legal.imprint.contact" },
        { heading: "legal.imprint.registerHeading", body: "legal.imprint.register" },
        { heading: "legal.imprint.responsibleHeading", body: "legal.imprint.responsible" },
      ]}
    />
  );
}

/** Informationspflichten nach Art. 13 DSGVO. */
export function PrivacyPage() {
  return (
    <LegalPage
      titleKey="legal.privacy.title"
      sections={[
        { heading: "legal.privacy.controllerHeading", body: "legal.privacy.controller" },
        { heading: "legal.privacy.purposeHeading", body: "legal.privacy.purpose" },
        { heading: "legal.privacy.storageHeading", body: "legal.privacy.storage" },
        { heading: "legal.privacy.rightsHeading", body: "legal.privacy.rights" },
        { heading: "legal.privacy.hostingHeading", body: "legal.privacy.hosting" },
      ]}
    />
  );
}
