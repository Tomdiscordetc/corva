import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createActivityId,
  createContactId,
  type Contact,
  type ContactActivity,
  type PipelineStage,
} from "@/demo/contacts";
import { api, ApiError, SERVER_MODE } from "@/lib/api";
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

/** Was zum Wiederherstellen eines gelöschten Kontakts gebraucht wird. */
export interface RemovedContact {
  contact: Contact;
  index: number;
  activities: ContactActivity[];
}

interface ContactsResponse {
  contacts: Contact[];
  assignees: { id: string; name: string }[];
}

const FAILED = "Die Änderung konnte nicht gespeichert werden.";

/**
 * Der Server führt „letzter Kontakt" selbst — er ergibt sich aus dem Verlauf.
 * Deshalb geht das Feld nicht mit zum Server; er weist Unbekanntes ab.
 */
function payload(draft: Partial<ContactDraft>) {
  const { lastContactAt: _ignored, ...rest } = draft;
  return rest;
}

/**
 * Kontaktverwaltung. Im Server-Modus liegen die Daten beim Mandanten, sodass
 * das ganze Team denselben Bestand sieht; im Demo-Modus bleibt alles auf
 * diesem Gerät. Die Oberfläche merkt davon nichts — sie bekommt in beiden
 * Fällen dieselben Felder und Funktionen.
 */
export function useContacts(storage: Storage = window.localStorage) {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    if (SERVER_MODE) return [];
    try {
      return readContacts(storage);
    } catch {
      return [];
    }
  });
  const [activities, setActivities] = useState<ContactActivity[]>(() => {
    if (SERVER_MODE) return [];
    try {
      return readActivities(storage);
    } catch {
      return [];
    }
  });
  const [serverAssignees, setServerAssignees] = useState<string[]>([]);
  const [loading, setLoading] = useState(SERVER_MODE);
  const [filter, setFilter] = useState<ContactFilter>(DEFAULT_CONTACT_FILTER);
  const [error, setError] = useState<string | null>(null);

  /*
    Wie bei den Aufgaben: zwei Änderungen im selben Render-Zyklus würden sonst
    beide auf dem Stand des letzten Renders rechnen. Diese Referenz ist die
    Quelle für lokale Änderungen.
  */
  const contactsRef = useRef(contacts);
  const activitiesRef = useRef(activities);
  /** Verlauf wird je Kontakt bei Bedarf nachgeladen. */
  const loadedHistories = useRef(new Set<string>());

  const applyLocal = useCallback(
    (
      mutate: (current: Contact[]) => Contact[],
      mutateActivities?: (current: ContactActivity[]) => ContactActivity[],
    ) => {
      const previousContacts = contactsRef.current;
      const previousActivities = activitiesRef.current;
      const nextContacts = mutate(previousContacts);
      const nextActivities = mutateActivities ? mutateActivities(previousActivities) : previousActivities;

      contactsRef.current = nextContacts;
      activitiesRef.current = nextActivities;
      setContacts(nextContacts);
      if (mutateActivities) setActivities(nextActivities);

      if (SERVER_MODE) return true;
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
        setError(FAILED);
        return false;
      }
    },
    [storage],
  );

  const load = useCallback(async () => {
    if (!SERVER_MODE) return;
    try {
      const data = await api<ContactsResponse>("/contacts");
      contactsRef.current = data.contacts;
      setContacts(data.contacts);
      setServerAssignees(data.assignees.map((entry) => entry.name));
      setError(null);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Führt eine Server-Aktion aus und meldet einen Fehlschlag zurück. */
  const call = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    try {
      const result = await action();
      setError(null);
      return result;
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : FAILED);
      void load();
      return null;
    }
  }, [load]);

  const add = useCallback(
    (draft: ContactDraft) => {
      if (SERVER_MODE) {
        void call(async () => {
          const { contact } = await api<{ contact: Contact }>("/contacts", { method: "POST", body: payload(draft) });
          applyLocal((current) => [contact, ...current]);
          return contact;
        });
        return null;
      }
      const contact: Contact = { ...draft, id: createContactId(), createdAt: new Date().toISOString() };
      applyLocal((current) => [contact, ...current]);
      return contact;
    },
    [applyLocal, call],
  );

  const update = useCallback(
    (id: string, patch: Partial<ContactDraft>) => {
      applyLocal((current) => updateContact(current, id, patch));
      if (SERVER_MODE) {
        void call(async () => {
          const { contact } = await api<{ contact: Contact }>(`/contacts/${id}`, { method: "PATCH", body: payload(patch) });
          applyLocal((current) => updateContact(current, id, contact));
          return contact;
        });
      }
    },
    [applyLocal, call],
  );

  const moveToStage = useCallback(
    (id: string, stage: PipelineStage) => {
      applyLocal((current) => moveContactToStage(current, id, stage));
      if (SERVER_MODE) {
        void call(() => api<{ contact: Contact }>(`/contacts/${id}`, { method: "PATCH", body: { stage } }));
      }
    },
    [applyLocal, call],
  );

  const remove = useCallback(
    (id: string): RemovedContact | null => {
      const result = removeContact(contactsRef.current, id);
      if (!result) return null;
      const removedActivities = activitiesForContact(activitiesRef.current, id);
      applyLocal(
        () => result.next,
        (current) => removeActivitiesOf(current, id),
      );
      if (SERVER_MODE) {
        void call(() => api(`/contacts/${id}`, { method: "DELETE", body: {} }));
      }
      return { contact: result.contact, index: result.index, activities: removedActivities };
    },
    [applyLocal, call],
  );

  const restore = useCallback(
    (contact: Contact, index: number, removedActivities: ContactActivity[]) => {
      applyLocal(
        (current) => restoreContact(current, contact, index),
        (current) => [...current, ...removedActivities.filter((a) => !current.some((e) => e.id === a.id))],
      );
      if (SERVER_MODE) {
        // Der Server hat den Kontakt nur in den Papierkorb gelegt — samt Verlauf.
        void call(() => api<{ contact: Contact }>(`/contacts/${contact.id}/restore`, { method: "POST", body: {} }));
      }
    },
    [applyLocal, call],
  );

  const logActivity = useCallback(
    (entry: Omit<ContactActivity, "id" | "demo">) => {
      if (SERVER_MODE) {
        void call(async () => {
          const result = await api<{ activity: ContactActivity; contact: Contact }>(
            `/contacts/${entry.contactId}/activities`,
            { method: "POST", body: { channel: entry.channel, direction: entry.direction, description: entry.description } },
          );
          applyLocal(
            (current) => updateContact(current, entry.contactId, { lastContactAt: result.contact.lastContactAt }),
            (current) => [result.activity, ...current],
          );
          return result.activity;
        });
        return null;
      }
      const activity: ContactActivity = { ...entry, id: createActivityId() };
      applyLocal(
        (current) => updateContact(current, entry.contactId, { lastContactAt: entry.timestamp }),
        (current) => [activity, ...current],
      );
      return activity;
    },
    [applyLocal, call],
  );

  /** Lädt den Verlauf eines Kontakts nach — die Akte ruft das beim Öffnen. */
  const ensureHistory = useCallback(
    (id: string) => {
      if (!SERVER_MODE || !id || loadedHistories.current.has(id)) return;
      loadedHistories.current.add(id);
      void call(async () => {
        const { activities: loaded } = await api<{ activities: ContactActivity[] }>(`/contacts/${id}/activities`);
        applyLocal(
          (current) => current,
          (current) => [...loaded, ...current.filter((entry) => entry.contactId !== id)],
        );
        return loaded;
      });
    },
    [applyLocal, call],
  );

  const visible = useMemo(() => filterContacts(contacts, filter), [contacts, filter]);
  const stageCounts = useMemo(() => countByStage(contacts), [contacts]);
  const assignees = useMemo(() => {
    if (SERVER_MODE) return serverAssignees;
    return [...new Set(contacts.map((contact) => contact.assignee))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "de"));
  }, [contacts, serverAssignees]);
  const hasOnlyDemo = !SERVER_MODE && contacts.length > 0 && contacts.every((contact) => contact.demo);

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
    loading,
    hasOnlyDemo,
    byId,
    historyOf,
    ensureHistory,
    reload: load,
    add,
    update,
    moveToStage,
    remove,
    restore,
    logActivity,
  };
}
