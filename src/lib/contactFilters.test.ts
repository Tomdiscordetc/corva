import { describe, expect, it } from "vitest";
import type { Contact } from "@/demo/contacts";
import {
  countByStage,
  daysSinceContact,
  filterContacts,
  isStale,
  DEFAULT_CONTACT_FILTER,
} from "./contactFilters";

const NOW = new Date("2026-09-06T12:00:00");
const day = (offset: number) => new Date(NOW.getTime() - offset * 86_400_000).toISOString();

function contact(overrides: Partial<Contact> & { id: string }): Contact {
  return {
    firstName: "Vor",
    lastName: "Nach",
    email: "vor.nach@example.de",
    phone: "",
    whatsapp: "",
    instagram: "",
    city: "Hannover",
    stage: "neu",
    branches: ["kfz"],
    assignee: "Sabine Krüger",
    source: "email",
    notes: "",
    createdAt: day(10),
    lastContactAt: day(1),
    ...overrides,
  };
}

const bestand: Contact[] = [
  contact({ id: "neu", firstName: "Laura", lastName: "Fischer", stage: "neu", lastContactAt: "" }),
  contact({ id: "beratung", firstName: "Mehmet", lastName: "Aydın", stage: "beratung", branches: ["leben"], assignee: "Mehmet Aydın", lastContactAt: day(2) }),
  contact({ id: "angebot", firstName: "Sandra", lastName: "Voigt", stage: "angebot", branches: ["kranken"], lastContactAt: day(9) }),
  contact({ id: "abschluss", firstName: "Michael", lastName: "Reuter", stage: "abschluss", lastContactAt: day(30) }),
  contact({ id: "verloren", firstName: "Nadine", lastName: "Weber", stage: "verloren", lastContactAt: day(20) }),
];

describe("Kontakt-Filter", () => {
  it("zählt je Pipeline-Stufe", () => {
    const counts = countByStage(bestand);
    expect(counts.neu).toBe(1);
    expect(counts.angebot).toBe(1);
    expect(counts.kontaktiert).toBe(0);
  });

  it("rechnet Tage seit dem letzten Kontakt, ohne Kontakt bleibt es leer", () => {
    expect(daysSinceContact(bestand[1]!, NOW)).toBe(2);
    expect(daysSinceContact(bestand[0]!, NOW)).toBeNull();
  });

  it("meldet liegengebliebene Kontakte, aber nicht Abgeschlossenes oder Verlorenes", () => {
    expect(isStale(bestand[2]!, NOW)).toBe(true);
    expect(isStale(bestand[1]!, NOW)).toBe(false);
    expect(isStale(bestand[3]!, NOW)).toBe(false);
    expect(isStale(bestand[4]!, NOW)).toBe(false);
  });

  it("stellt nie Kontaktierte nach vorn und sortiert sonst nach letztem Kontakt", () => {
    const result = filterContacts(bestand, DEFAULT_CONTACT_FILTER, NOW);
    expect(result.map((c) => c.id)).toEqual(["neu", "beratung", "angebot", "verloren", "abschluss"]);
  });

  it("filtert nach Stufe, Sparte und Zuständigkeit", () => {
    expect(filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, stage: "angebot" }, NOW).map((c) => c.id)).toEqual(["angebot"]);
    expect(filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, branch: "leben" }, NOW).map((c) => c.id)).toEqual(["beratung"]);
    expect(filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, assignee: "Mehmet Aydın" }, NOW).map((c) => c.id)).toEqual(["beratung"]);
  });

  it("sucht über Name, Ort und Notiz", () => {
    expect(filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, query: "fischer" }, NOW).map((c) => c.id)).toEqual(["neu"]);
    expect(filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, query: "hannover" }, NOW)).toHaveLength(5);

    const mitNotiz = [...bestand, contact({ id: "notiz", notes: "Wechsel zum Jahresende" })];
    expect(filterContacts(mitNotiz, { ...DEFAULT_CONTACT_FILTER, query: "jahresende" }, NOW).map((c) => c.id)).toEqual(["notiz"]);
  });

  it("sortiert auf Wunsch nach Name und nach Stufe", () => {
    const nachName = filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, sort: "name" }, NOW);
    expect(nachName[0]!.lastName).toBe("Aydın");

    const nachStufe = filterContacts(bestand, { ...DEFAULT_CONTACT_FILTER, sort: "stufe" }, NOW);
    expect(nachStufe.map((c) => c.stage)).toEqual(["neu", "beratung", "angebot", "abschluss", "verloren"]);
  });
});
