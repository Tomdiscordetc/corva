import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { installLocalStorageStub } from "@/test/localStorageStub";

installLocalStorageStub();

const { LoginPage } = await import("./LoginPage");
const { UnlockSequence } = await import("./UnlockSequence");
const { VerificationSequence } = await import("./VerificationSequence");
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
  it("zeigt das Markenpanel und den ersten Schritt", () => {
    const html = render(<LoginPage />);

    expect(html).toContain("Alle Kontaktwege an einem Ort");
    expect(html).toContain("E-Mail-Adresse");
    expect(html).toContain("Weiter");
    expect(html).toContain('aria-label="Design"');
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

  it("rendert die Prüf- und Entsperrphase", () => {
    expect(renderToString(<VerificationSequence />)).toContain("Zugang wird geprüft");
    expect(renderToString(<UnlockSequence />)).toContain("Arbeitsbereich entsperrt");
  });
});
