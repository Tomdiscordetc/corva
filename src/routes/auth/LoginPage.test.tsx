import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/store/auth";
import { LoginPage } from "./LoginPage";
import { UnlockSequence } from "./UnlockSequence";
import { VerificationSequence } from "./VerificationSequence";

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: "signed-out",
      user: null,
      previewRole: null,
      error: null,
    });
  });

  it("renders the branded login form without browser-only failures", () => {
    const html = renderToString(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(html).toContain("Alle Kontaktwege an einem Ort");
    expect(html).toContain("E-Mail-Adresse");
    expect(html).toContain("Passwort vergessen?");
    expect(html).toContain("aria-label=\"Design\"");
  });

  it("renders the unlock sequence after a successful login", () => {
    const html = renderToString(<UnlockSequence />);

    expect(html).toContain("Zugang bestätigt");
    expect(html).toContain("Arbeitsbereich entsperrt");
  });

  it("renders the credential verification phase", () => {
    const html = renderToString(<VerificationSequence />);

    expect(html).toContain("Zugang wird geprüft");
    expect(html).toContain("Anmeldedaten werden abgeglichen");
  });
});
