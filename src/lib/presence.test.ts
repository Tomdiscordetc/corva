import { describe, expect, it } from "vitest";
import { PRESENCE_COLOR_VAR, PRESENCE_ORDER, presenceFromLabel } from "./presence";

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

  it("hat für jede Stufe ein eigenes Farb-Token", () => {
    const vars = PRESENCE_ORDER.map((status) => PRESENCE_COLOR_VAR[status]);
    for (const name of vars) expect(name).toMatch(/^--color-presence-/);
    expect(new Set(vars).size).toBe(PRESENCE_ORDER.length);
  });
});
