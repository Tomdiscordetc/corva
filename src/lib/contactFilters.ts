import {
  contactName,
  PIPELINE_STAGES,
  type Contact,
  type InsuranceBranch,
  type PipelineStage,
} from "@/demo/contacts";

export type ContactSort = "zuletzt" | "name" | "angelegt" | "stufe";

export interface ContactFilter {
  query: string;
  stage: PipelineStage | "alle";
  branch: InsuranceBranch | "alle";
  assignee: string | "alle";
  sort: ContactSort;
}

export const DEFAULT_CONTACT_FILTER: ContactFilter = {
  query: "",
  stage: "alle",
  branch: "alle",
  assignee: "alle",
  sort: "zuletzt",
};

const STAGE_ORDER = new Map(PIPELINE_STAGES.map((stage, index) => [stage, index]));

export function countByStage(contacts: Contact[]): Record<PipelineStage, number> {
  const counts = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, 0])) as Record<PipelineStage, number>;
  for (const contact of contacts) counts[contact.stage] += 1;
  return counts;
}

/**
 * Tage seit dem letzten Kontakt. `null`, wenn noch nie gesprochen wurde —
 * das ist etwas anderes als „vor 0 Tagen" und wird in der Liste auch anders
 * dargestellt.
 */
export function daysSinceContact(contact: Contact, now = new Date()): number | null {
  if (!contact.lastContactAt) return null;
  const then = new Date(contact.lastContactAt).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

/**
 * Kontakte, die zu lange liegen: offene Stufen ohne Rückmeldung seit einer
 * Woche. Abgeschlossenes und Verlorenes bleibt außen vor.
 */
export function isStale(contact: Contact, now = new Date(), days = 7) {
  if (contact.stage === "abschluss" || contact.stage === "verloren") return false;
  const since = daysSinceContact(contact, now);
  return since !== null && since >= days;
}

export function filterContacts(contacts: Contact[], filter: ContactFilter, now = new Date()): Contact[] {
  const needle = filter.query.trim().toLowerCase();

  const filtered = contacts.filter((contact) => {
    if (filter.stage !== "alle" && contact.stage !== filter.stage) return false;
    if (filter.branch !== "alle" && !contact.branches.includes(filter.branch)) return false;
    if (filter.assignee !== "alle" && contact.assignee !== filter.assignee) return false;
    if (!needle) return true;
    return (
      contactName(contact).toLowerCase().includes(needle) ||
      contact.email.toLowerCase().includes(needle) ||
      contact.phone.toLowerCase().includes(needle) ||
      contact.city.toLowerCase().includes(needle) ||
      contact.notes.toLowerCase().includes(needle) ||
      contact.instagram.toLowerCase().includes(needle)
    );
  });

  return [...filtered].sort((a, b) => {
    switch (filter.sort) {
      case "name":
        return compareByName(a, b);
      case "angelegt":
        return b.createdAt.localeCompare(a.createdAt);
      case "stufe": {
        const byStage = (STAGE_ORDER.get(a.stage) ?? 0) - (STAGE_ORDER.get(b.stage) ?? 0);
        return byStage !== 0 ? byStage : compareLastContact(a, b, now);
      }
      default:
        return compareLastContact(a, b, now);
    }
  });
}

/** Nach Nachname, bei Gleichstand nach Vorname — so sucht man in einer Kartei. */
function compareByName(a: Contact, b: Contact) {
  const byLast = a.lastName.localeCompare(b.lastName, "de");
  return byLast !== 0 ? byLast : a.firstName.localeCompare(b.firstName, "de");
}

/** Zuletzt Kontaktierte zuerst; wer noch nie erreicht wurde, steht ganz oben. */
function compareLastContact(a: Contact, b: Contact, now: Date) {
  const aSince = daysSinceContact(a, now);
  const bSince = daysSinceContact(b, now);
  if (aSince === null && bSince === null) return compareByName(a, b);
  if (aSince === null) return -1;
  if (bSince === null) return 1;
  return aSince - bSince;
}
