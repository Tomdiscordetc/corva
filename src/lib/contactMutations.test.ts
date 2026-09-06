import { describe, expect, it } from "vitest";
import type { Contact, ContactActivity } from "@/demo/contacts";
import {
  activitiesForContact,
  moveContactToStage,
  removeActivitiesOf,
  removeContact,
  restoreContact,
  updateContact,
} from "./contactMutations";

function contact(id: string, overrides: Partial<Contact> = {}): Contact {
  return {
    id,
    firstName: "Vor",
    lastName: id.toUpperCase(),
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    city: "",
    stage: "neu",
    branches: [],
    assignee: "Sabine Krüger",
    source: "email",
    notes: "",
    createdAt: "2026-09-01T08:00:00.000Z",
    lastContactAt: "",
    ...overrides,
  };
}

function activity(id: string, contactId: string, timestamp: string): ContactActivity {
  return { id, contactId, channel: "email", direction: "ausgehend", description: id, timestamp };
}

const bestand = [contact("a"), contact("b"), contact("c")];
const verlauf = [
  activity("alt", "a", "2026-09-01T08:00:00.000Z"),
  activity("neu", "a", "2026-09-05T08:00:00.000Z"),
  activity("fremd", "b", "2026-09-03T08:00:00.000Z"),
];

describe("Kontakt-Änderungen", () => {
  it("ändert nur den getroffenen Kontakt", () => {
    const next = updateContact(bestand, "b", { city: "Celle" });
    expect(next[1]!.city).toBe("Celle");
    expect(next[0]).toBe(bestand[0]);
  });

  it("verschiebt auf eine andere Stufe", () => {
    expect(moveContactToStage(bestand, "a", "angebot")[0]!.stage).toBe("angebot");
  });

  it("lässt den Bestand unangetastet, wenn die Stufe schon stimmt", () => {
    // Wichtig fürs Ziehen: ein Ablegen in derselben Spalte darf nichts auslösen.
    expect(moveContactToStage(bestand, "a", "neu")).toBe(bestand);
  });

  it("ignoriert unbekannte Kontakte beim Verschieben", () => {
    expect(moveContactToStage(bestand, "gibtsnicht", "angebot")).toBe(bestand);
  });

  it("löscht und merkt sich die Position", () => {
    const result = removeContact(bestand, "b");
    expect(result?.index).toBe(1);
    expect(result?.next.map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("setzt einen gelöschten Kontakt an seine alte Stelle zurück", () => {
    const removed = removeContact(bestand, "b")!;
    expect(restoreContact(removed.next, removed.contact, removed.index).map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("legt beim doppelten Wiederherstellen keinen zweiten Eintrag an", () => {
    const removed = removeContact(bestand, "b")!;
    const once = restoreContact(removed.next, removed.contact, removed.index);
    expect(restoreContact(once, removed.contact, removed.index)).toBe(once);
  });

  it("gibt den Verlauf eines Kontakts neueste zuerst zurück", () => {
    expect(activitiesForContact(verlauf, "a").map((a) => a.id)).toEqual(["neu", "alt"]);
  });

  it("entfernt mit dem Kontakt auch dessen Verlauf, aber nicht den der anderen", () => {
    expect(removeActivitiesOf(verlauf, "a").map((a) => a.id)).toEqual(["fremd"]);
  });
});
