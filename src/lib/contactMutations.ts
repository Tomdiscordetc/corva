import type { Contact, ContactActivity, PipelineStage } from "@/demo/contacts";

/**
 * Reine Änderungsschritte auf dem Kontaktbestand — ausgelagert, damit sie
 * ohne Oberfläche prüfbar sind und der Hook sie auf dem jeweils aktuellen
 * Stand anwenden kann statt auf dem des letzten Renders.
 */

export function updateContact(contacts: Contact[], id: string, patch: Partial<Contact>): Contact[] {
  return contacts.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact));
}

/** Verschiebt einen Kontakt auf eine andere Stufe. Gleiche Stufe = unverändert. */
export function moveContactToStage(contacts: Contact[], id: string, stage: PipelineStage): Contact[] {
  const contact = contacts.find((entry) => entry.id === id);
  if (!contact || contact.stage === stage) return contacts;
  return updateContact(contacts, id, { stage });
}

export function removeContact(
  contacts: Contact[],
  id: string,
): { next: Contact[]; contact: Contact; index: number } | null {
  const index = contacts.findIndex((contact) => contact.id === id);
  if (index === -1) return null;
  return { next: contacts.filter((contact) => contact.id !== id), contact: contacts[index]!, index };
}

/**
 * Setzt einen gelöschten Kontakt an seine alte Stelle zurück. Ist er bereits
 * vorhanden — etwa nach zweimal „Rückgängig" — bleibt der Bestand unverändert.
 */
export function restoreContact(contacts: Contact[], contact: Contact, index: number): Contact[] {
  if (contacts.some((existing) => existing.id === contact.id)) return contacts;
  const next = [...contacts];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, contact);
  return next;
}

/** Verlauf eines Kontakts, neueste zuerst. */
export function activitiesForContact(activities: ContactActivity[], contactId: string): ContactActivity[] {
  return activities
    .filter((activity) => activity.contactId === contactId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/** Mit dem Kontakt verschwindet auch sein Verlauf. */
export function removeActivitiesOf(activities: ContactActivity[], contactId: string): ContactActivity[] {
  return activities.filter((activity) => activity.contactId !== contactId);
}
