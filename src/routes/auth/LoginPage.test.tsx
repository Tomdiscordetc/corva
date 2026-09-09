import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/test/localStorageStub";

installLocalStorageStub();

/*
  Geprüft wird die Demo-Fassung der Anmeldung. Im Server-Modus — seit dem
  Server-Umbau der Standard — zeigt die Seite stattdessen den Ladezustand der
  Sitzungsprüfung, und einzelne Schritte tauschen ihre Texte gegen die des
  Servers. Der Modus wird deshalb vor dem Laden der Module festgelegt.
*/
vi.stubEnv("VITE_AUTH_MODE", "demo");

const { LoginPage } = await import("./LoginPage");
const { AuthVisual, AUTH_SEQUENCE_MS, GRANTED_STEPS } = await import("./AuthVisual");
const { IdentifyStep } = await import("./steps/IdentifyStep");
const { PasswordStep } = await import("./steps/PasswordStep");
const { TwoFactorStep } = await import("./steps/TwoFactorStep");
const { SetPasswordStep } = await import("./steps/SetPasswordStep");
const { RecoverStep, RecoverSentStep } = await import("./steps/RecoverStep");

/*
  Die Schritte werden einzeln gerendert statt über die LoginPage: Zustand
  liefert beim Server-Rendering immer den Anfangszustand des Stores, ein
  vorher gesetzter Schritt käme also nie an. Das Verhalten des Ablaufs deckt
  `src/store/auth.test.ts` ab, hier geht es um Aufbau und Texte je Schritt.
*/
function render(ui: React.ReactNode) {
  return renderToString(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Anmeldeseite", () => {
  it("zeigt die Bühne, die Erzählspalte und den ersten Schritt", () => {
    const html = render(<LoginPage />);

    expect(html).toContain("Alle Kontaktwege an einem Ort");
    expect(html).toContain("Alles verbunden.");
    expect(html).toContain("E-Mail-Adresse");
    expect(html).toContain("Weiter");
    expect(html).toContain('aria-label="Design"');
  });

  it("zeichnet die Bühne erst im Browser und zeigt bis dahin den Ersatz", () => {
    const html = render(<LoginPage />);

    // Ohne WebGL-Kontext bleibt es beim gemalten Ersatz — auch beim
    // Server-Rendering, wo es noch gar kein Canvas gibt.
    expect(html).toContain('data-renderer="fallback"');
    expect(html).toContain("auth-scene-canvas");
  });

  it("hält keine sichtbaren Texte im Code", () => {
    const html = render(<LoginPage />);

    // Alles aus der Sprachdatei: Kennung der Bühne und die vier Kanäle.
    expect(html).toContain("CORVA / CONNECTED");
    expect(html).toContain("WhatsApp");
    expect(html).toContain("Animation pausieren");
    expect(html).not.toContain("auth.login.");
  });

  it("fragt im ersten Schritt nur die E-Mail ab", () => {
    const html = render(<IdentifyStep />);

    expect(html).toContain("E-Mail-Adresse");
    expect(html).toContain("Passwort vergessen?");
    expect(html).toContain("Schritt 1 von 2");
    // Passwortfeld und Angemeldet-bleiben kommen erst im zweiten Schritt.
    expect(html).not.toContain("Angemeldet bleiben");
  });

  it("zeigt im zweiten Schritt Passwort, Rückweg und Angemeldet-bleiben", () => {
    const html = render(<PasswordStep />);

    expect(html).toContain("Passwort eingeben");
    expect(html).toContain("Angemeldet bleiben");
    expect(html).toContain("Andere E-Mail verwenden");
    expect(html).toContain("Schritt 2 von 2");
  });

  it("zeigt den Bestätigungscode samt Vertrauens-Option und Demo-Hinweis", () => {
    const html = render(<TwoFactorStep />);

    expect(html).toContain("Bestätigungscode");
    expect(html).toContain("Diesem Gerät vertrauen");
    expect(html).toContain("one-time-code");
    expect(html).toContain("123456");
  });

  it("zeigt die Passwortvergabe mit allen Regeln", () => {
    const html = render(<SetPasswordStep />);

    expect(html).toContain("Eigenes Passwort festlegen");
    expect(html).toContain("Mindestens 10 Zeichen");
    expect(html).toContain("Groß- und Kleinbuchstaben");
    expect(html).toContain("Mindestens eine Ziffer");
    expect(html).toContain("Passwort wiederholen");
  });

  it("zeigt den Zweig zum Zurücksetzen und dessen Bestätigung", () => {
    expect(render(<RecoverStep />)).toContain("Passwort zurücksetzen");

    const sent = render(<RecoverSentStep />);
    expect(sent).toContain("Prüfe dein Postfach");
    expect(sent).toContain("Zurück zur Anmeldung");
  });

  it("wartet mit dem Dashboard, bis die Kette durchgelaufen ist", () => {
    // Sonst wird mitten im Aufbrechen weggeschaltet und die Sequenz bricht ab.
    const letzterSchritt = Math.max(...Object.values(GRANTED_STEPS));
    expect(AUTH_SEQUENCE_MS).toBeGreaterThan(letzterSchritt);
  });

  it("führt die Kette in der richtigen Reihenfolge", () => {
    // Grün vor Schloss, Schloss vor Bügel, Bügel vor Bruch, Bruch vor Auflösen.
    const { lines, lock, shackle, burst, clear } = GRANTED_STEPS;
    expect(lines).toBeLessThan(lock);
    expect(lock).toBeLessThan(shackle);
    expect(shackle).toBeLessThan(burst);
    expect(burst).toBeLessThan(clear);
  });

  it("beschriftet das Markenfeld je nach Stand der Anmeldung", () => {
    // Rot heißt „noch nicht verbunden" — die Beschriftung darf das nicht als
    // Fehler ausgeben, sonst liest ein Screenreader jede Anmeldung als Panne.
    expect(render(<AuthVisual />)).toContain("Verbindung steht noch nicht");
    expect(render(<AuthVisual phase="checking" />)).toContain("Verbindung wird geprüft");
    expect(render(<AuthVisual phase="granted" />)).toContain("Zugang bestätigt");
  });
});
