import { useCallback, useMemo, useRef, useState } from "react";
import {
  createActivityId,
  createContactId,
  type Contact,
  type ContactActivity,
  type PipelineStage,
} from "@/demo/contacts";
import {
  readActivities,
  readContacts,
  writeActivities,
  writeContacts,
} from "@/lib/contactsStorage";
import {
  activitiesForContact,
  moveContactToStage,
  removeActivitiesOf,
  removeContact,
  restoreContact,
  updateContact,
} from "@/lib/contactMutations";
import {
  countByStage,
  filterContacts,
  DEFAULT_CONTACT_FILTER,
  type ContactFilter,
} from "@/lib/contactFilters";

export type ContactDraft = Omit<Contact, "id" | "createdAt" | "demo">;

/**
 * Kontaktverwaltung auf dem lokalen Speicher. Änderungen erscheinen sofort
 * und werden danach geschrieben; scheitert das Schreiben (etwa im privaten
 * Fenster), wird der vorherige Stand wiederhergestellt und gemeldet.
 */
export function useContacts(storage: Storage = window.localStorage) {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      return readContacts(storage);
    } catch {
      return [];
    }
  });
  const [activities, setActivities] = useState<ContactActivity[]>(() => {
    try {
      return readActivities(storage);
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState<ContactFilter>(DEFAULT_CONTACT_FILTER);
  const [error, setError] = useState<string | null>(null);

  /*
    Wie bei den Aufgaben: zwei Änderungen im selben Render-Zyklus — etwa
    Ziehen und sofort Löschen — würden sonst beide auf dem Stand des letzten
    Renders rechnen. Diese Referenz ist die Quelle für Änderungen.
  */
  const contactsRef = useRef(contacts);
  const activitiesRef = useRef(activities);

  const commit = useCallback(
    (mutate: (current: Contact[]) => Contact[], mutateActivities?: (current: ContactActivity[]) => ContactActivity[]) => {
      const previousContacts = contactsRef.current;
      const previousActivities = activitiesRef.current;
      const nextContacts = mutate(previousContacts);
      const nextActivities = mutateActivities ? mutateActivities(previousActivities) : previousActivities;

      contactsRef.current = nextContacts;
      activitiesRef.current = nextActivities;
      setContacts(nextContacts);
      if (mutateActivities) setActivities(nextActivities);

      try {
        writeContacts(nextContacts, storage);
        if (mutateActivities) writeActivities(nextActivities, storage);
        setError(null);
        return true;
      } catch {
        contactsRef.current = previousContacts;
        activitiesRef.current = previousActivities;
        setContacts(previousContacts);
        setActivities(previousActivities);
        setError("Die Änderung konnte nicht gespeichert werden.");
        return false;
      }
    },
    [storage],
  );

  const add = useCallback(
    (draft: ContactDraft) => {
      const contact: Contact = { ...draft, id: createContactId(), createdAt: new Date().toISOString() };
      commit((current) => [contact, ...current]);
      return contact;
    },
    [commit],
  );

  const update = useCallback(
    (id: string, patch: Partial<ContactDraft>) => commit((current) => updateContact(current, id, patch)),
    [commit],
  );

  const moveToStage = useCallback(
    (id: string, stage: PipelineStage) => commit((current) => moveContactToStage(current, id, stage)),
    [commit],
  );

  /** Gibt Kontakt, Position und seinen Verlauf zurück, damit alles zurückgeholt werden kann. */
  const remove = useCallback(
    (id: string) => {
      const result = removeContact(contactsRef.current, id);
      if (!result) return null;
      const removedActivities = activitiesForContact(activitiesRef.current, id);
      commit(
        () => result.next,
        (current) => removeActivitiesOf(current, id),
      );
      return { contact: result.contact, index: result.index, activities: removedActivities };
    },
    [commit],
  );

  const restore = useCallback(
    (contact: Contact, index: number, removedActivities: ContactActivity[]) =>
      commit(
        (current) => restoreContact(current, contact, index),
        (current) => [...current, ...removedActivities.filter((a) => !current.some((e) => e.id === a.id))],
      ),
    [commit],
  );

  /** Neuer Verlaufseintrag; aktualisiert zugleich den Zeitpunkt des letzten Kontakts. */
  const logActivity = useCallback(
    (entry: Omit<ContactActivity, "id" | "demo">) => {
      const activity: ContactActivity = { ...entry, id: createActivityId() };
      commit(
        (current) => updateContact(current, entry.contactId, { lastContactAt: entry.timestamp }),
        (current) => [activity, ...current],
      );
      return activity;
    },
    [commit],
  );

  const visible = useMemo(() => filterContacts(contacts, filter), [contacts, filter]);
  const stageCounts = useMemo(() => countByStage(contacts), [contacts]);
  const assignees = useMemo(
    () => [...new Set(contacts.map((contact) => contact.assignee))].filter(Boolean).sort((a, b) => a.localeCompare(b, "de")),
    [contacts],
  );
  const hasOnlyDemo = contacts.length > 0 && contacts.every((contact) => contact.demo);

  const byId = useCallback((id: string) => contacts.find((contact) => contact.id === id) ?? null, [contacts]);
  const historyOf = useCallback((id: string) => activitiesForContact(activities, id), [activities]);

  return {
    contacts,
    visible,
    stageCounts,
    assignees,
    filter,
    setFilter,
    error,
    hasOnlyDemo,
    byId,
    historyOf,
    add,
    update,
    moveToStage,
    remove,
    restore,
    logActivity,
  };
}
