import {
  demoActivities,
  demoContacts,
  type Contact,
  type ContactActivity,
  PIPELINE_STAGES,
} from "@/demo/contacts";

const CONTACTS_KEY = "corva.contacts";
const ACTIVITIES_KEY = "corva.contactActivities";

/**
 * Kontakte und ihr Verlauf liegen bis zum Server-Abschnitt im lokalen
 * Speicher. Lesen und Schreiben sind hier gekapselt, damit der spätere
 * Tausch gegen echte Endpunkte nur diese Datei und den Hook betrifft.
 */
export function readContacts(storage: Storage): Contact[] {
  const raw = storage.getItem(CONTACTS_KEY);
  if (!raw) return demoContacts.map((contact) => ({ ...contact }));

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Gespeicherte Kontakte sind beschädigt.");
  return parsed.filter(isContact);
}

export function writeContacts(contacts: Contact[], storage: Storage) {
  storage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export function readActivities(storage: Storage): ContactActivity[] {
  const raw = storage.getItem(ACTIVITIES_KEY);
  if (!raw) return demoActivities.map((activity) => ({ ...activity }));

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Gespeicherter Verlauf ist beschädigt.");
  return parsed.filter(isActivity);
}

export function writeActivities(activities: ContactActivity[], storage: Storage) {
  storage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

/**
 * Prüft die tragenden Felder einzeln: von Hand veränderte oder ältere
 * Einträge sollen übersprungen werden, statt die Liste zum Absturz zu bringen.
 */
function isContact(value: unknown): value is Contact {
  if (!value || typeof value !== "object") return false;
  const contact = value as Record<string, unknown>;
  return (
    typeof contact.id === "string" &&
    typeof contact.firstName === "string" &&
    typeof contact.lastName === "string" &&
    Array.isArray(contact.branches) &&
    PIPELINE_STAGES.includes(contact.stage as never)
  );
}

function isActivity(value: unknown): value is ContactActivity {
  if (!value || typeof value !== "object") return false;
  const activity = value as Record<string, unknown>;
  return (
    typeof activity.id === "string" &&
    typeof activity.contactId === "string" &&
    typeof activity.description === "string" &&
    typeof activity.timestamp === "string"
  );
}
