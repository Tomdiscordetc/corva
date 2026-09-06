import type { Channel } from "./dashboard";

/**
 * Kontakte sind der Kern des CRM: alles andere — Aufgaben, Posteingang,
 * Kalender — hängt daran. Solange kein Server dahinter steht, liegt der
 * Bestand im lokalen Speicher (siehe lib/contactsStorage). Der mitgelieferte
 * Beispielbestand ist in der Oberfläche gekennzeichnet (REGELN.md Punkt 5).
 */

/** Stufen von der Anfrage bis zum Abschluss. */
export type PipelineStage = "neu" | "kontaktiert" | "beratung" | "angebot" | "abschluss" | "verloren";

export const PIPELINE_STAGES: PipelineStage[] = [
  "neu",
  "kontaktiert",
  "beratung",
  "angebot",
  "abschluss",
  "verloren",
];

/** Stufen, die im Trichter nebeneinander stehen — „verloren" liegt daneben. */
export const ACTIVE_STAGES: PipelineStage[] = PIPELINE_STAGES.filter((stage) => stage !== "verloren");

export type InsuranceBranch =
  | "kfz"
  | "haftpflicht"
  | "hausrat"
  | "wohngebaeude"
  | "leben"
  | "kranken"
  | "berufsunfaehigkeit"
  | "rechtsschutz"
  | "unfall";

export const INSURANCE_BRANCHES: InsuranceBranch[] = [
  "kfz",
  "haftpflicht",
  "hausrat",
  "wohngebaeude",
  "leben",
  "kranken",
  "berufsunfaehigkeit",
  "rechtsschutz",
  "unfall",
];

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  city: string;
  stage: PipelineStage;
  /** Sparten, um die es bei diesem Kontakt geht. */
  branches: InsuranceBranch[];
  assignee: string;
  /** Über welchen Weg die Anfrage kam. */
  source: Channel;
  notes: string;
  createdAt: string;
  /** Letzter Kontakt, ISO-Zeitstempel; leer wenn noch nie gesprochen. */
  lastContactAt: string;
  demo?: boolean;
}

/** Ein Eintrag im Verlauf der Kontaktakte. */
export interface ContactActivity {
  id: string;
  contactId: string;
  channel: Channel;
  direction: "eingehend" | "ausgehend";
  description: string;
  timestamp: string;
  demo?: boolean;
}

export function contactName(contact: Pick<Contact, "firstName" | "lastName">) {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function createContactId() {
  return `contact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createActivityId() {
  return `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const demoContacts: Contact[] = [
  {
    id: "c-fischer",
    firstName: "Laura",
    lastName: "Fischer",
    email: "laura.fischer@example.de",
    phone: "+49 151 2345678",
    whatsapp: "+49 151 2345678",
    instagram: "@laura.f",
    city: "Hannover",
    stage: "neu",
    branches: ["kfz"],
    assignee: "Sabine Krüger",
    source: "instagram",
    notes: "Über Story-Kampagne gekommen, sucht Wechselangebot zum Jahresende.",
    createdAt: hoursAgo(3),
    lastContactAt: hoursAgo(3),
    demo: true,
  },
  {
    id: "c-brandt",
    firstName: "Kevin",
    lastName: "Brandt",
    email: "k.brandt@example.de",
    phone: "+49 170 9988776",
    whatsapp: "+49 170 9988776",
    instagram: "",
    city: "Braunschweig",
    stage: "kontaktiert",
    branches: ["hausrat", "haftpflicht"],
    assignee: "Sabine Krüger",
    source: "whatsapp",
    notes: "Umzug in größere Wohnung, Deckungssumme muss angepasst werden.",
    createdAt: daysAgo(4),
    lastContactAt: hoursAgo(26),
    demo: true,
  },
  {
    id: "c-aydin",
    firstName: "Mehmet",
    lastName: "Aydın",
    email: "mehmet.aydin@example.de",
    phone: "+49 152 4433221",
    whatsapp: "",
    instagram: "",
    city: "Hildesheim",
    stage: "beratung",
    branches: ["berufsunfaehigkeit", "leben"],
    assignee: "Mehmet Aydın",
    source: "email",
    notes: "Selbstständig, braucht BU mit Nachversicherungsgarantie.",
    createdAt: daysAgo(11),
    lastContactAt: daysAgo(1),
    demo: true,
  },
  {
    id: "c-voigt",
    firstName: "Sandra",
    lastName: "Voigt",
    email: "s.voigt@example.de",
    phone: "+49 511 445566",
    whatsapp: "",
    instagram: "",
    city: "Hannover",
    stage: "angebot",
    branches: ["kranken"],
    assignee: "Julia Bergmann",
    source: "email",
    notes: "Angebot zur privaten Zusatzversicherung liegt zur Prüfung vor.",
    createdAt: daysAgo(18),
    lastContactAt: daysAgo(3),
    demo: true,
  },
  {
    id: "c-nowak",
    firstName: "Thomas",
    lastName: "Nowak",
    email: "thomas.nowak@example.de",
    phone: "+49 160 1122334",
    whatsapp: "+49 160 1122334",
    instagram: "",
    city: "Celle",
    stage: "angebot",
    branches: ["berufsunfaehigkeit"],
    assignee: "Thomas Nowak",
    source: "telefon",
    notes: "Wollte Rücksprache mit Partnerin halten, Wiedervorlage läuft.",
    createdAt: daysAgo(22),
    lastContactAt: daysAgo(6),
    demo: true,
  },
  {
    id: "c-reuter",
    firstName: "Michael",
    lastName: "Reuter",
    email: "m.reuter@example.de",
    phone: "+49 511 778899",
    whatsapp: "",
    instagram: "",
    city: "Laatzen",
    stage: "abschluss",
    branches: ["kfz", "rechtsschutz"],
    assignee: "Sabine Krüger",
    source: "telefon",
    notes: "KFZ und Rechtsschutz abgeschlossen, Bestandskunde seit 2024.",
    createdAt: daysAgo(40),
    lastContactAt: daysAgo(5),
    demo: true,
  },
  {
    id: "c-weber",
    firstName: "Nadine",
    lastName: "Weber",
    email: "nadine.weber@example.de",
    phone: "",
    whatsapp: "+49 176 5566778",
    instagram: "@nadine.wbr",
    city: "Hannover",
    stage: "verloren",
    branches: ["hausrat"],
    assignee: "Julia Bergmann",
    source: "tiktok",
    notes: "Hat sich für einen Direktversicherer entschieden.",
    createdAt: daysAgo(30),
    lastContactAt: daysAgo(12),
    demo: true,
  },
];

export const demoActivities: ContactActivity[] = [
  {
    id: "act-1",
    contactId: "c-fischer",
    channel: "instagram",
    direction: "eingehend",
    description: "Neue Anfrage über Story-Kampagne",
    timestamp: hoursAgo(3),
    demo: true,
  },
  {
    id: "act-2",
    contactId: "c-brandt",
    channel: "whatsapp",
    direction: "eingehend",
    description: "Rückfrage zur Hausratversicherung",
    timestamp: hoursAgo(26),
    demo: true,
  },
  {
    id: "act-3",
    contactId: "c-brandt",
    channel: "telefon",
    direction: "ausgehend",
    description: "Rückruf, Bedarf aufgenommen (12 Min.)",
    timestamp: daysAgo(2),
    demo: true,
  },
  {
    id: "act-4",
    contactId: "c-aydin",
    channel: "email",
    direction: "ausgehend",
    description: "Unterlagen zur Berufsunfähigkeit versandt",
    timestamp: daysAgo(1),
    demo: true,
  },
  {
    id: "act-5",
    contactId: "c-voigt",
    channel: "email",
    direction: "ausgehend",
    description: "Angebot zur Krankenzusatzversicherung zugesandt",
    timestamp: daysAgo(3),
    demo: true,
  },
  {
    id: "act-6",
    contactId: "c-reuter",
    channel: "telefon",
    direction: "ausgehend",
    description: "Beratungsgespräch geführt (18 Min.)",
    timestamp: daysAgo(5),
    demo: true,
  },
];
