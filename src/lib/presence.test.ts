import { describe, expect, it } from "vitest";
import { PRESENCE_ORDER, PRESENCE_STYLES, presenceFromLabel } from "./presence";

describe("Anwesenheit", () => {
  it("erkennt freie Kolleginnen und Kollegen", () => {
    expect(presenceFromLabel("aktiv")).toBe("frei");
    expect(presenceFromLabel("Frei")).toBe("frei");
    expect(presenceFromLabel("online")).toBe("frei");
  });

  it("erkennt Abwesenheit", () => {
    expect(presenceFromLabel("abwesend")).toBe("abwesend");
    expect(presenceFromLabel("Urlaub")).toBe("abwesend");
  });

  it("erkennt laufende Gespräche und Termine", () => {
    expect(presenceFromLabel("im Termin")).toBe("beschaeftigt");
    expect(presenceFromLabel("Im Gespräch mit Kunde")).toBe("beschaeftigt");
    expect(presenceFromLabel("telefoniert gerade")).toBe("beschaeftigt");
  });

  it("wertet Unbekanntes als beschäftigt statt als frei", () => {
    // Lieber einmal zu viel Rücksicht als ein Anruf mitten ins Kundengespräch.
    expect(presenceFromLabel("kryptischer Status")).toBe("beschaeftigt");
    expect(presenceFromLabel("")).toBe("beschaeftigt");
  });

  it("hat für jede Stufe Farbe und Leuchten hinterlegt", () => {
    for (const status of PRESENCE_ORDER) {
      expect(PRESENCE_STYLES[status].dotClass).toMatch(/^bg-presence-/);
      expect(PRESENCE_STYLES[status].glowClass).toMatch(/^presence-glow-/);
    }
  });
});
