import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/test/localStorageStub";

installLocalStorageStub();

const { useAuthStore, DEMO_TWO_FACTOR_CODE, DEMO_INITIAL_PASSWORD } = await import("./auth");

function reset() {
  localStorage.clear();
  useAuthStore.setState({
    status: "signed-out",
    step: "identify",
    direction: 1,
    email: "",
    rememberMe: true,
    resendIn: 0,
    busy: false,
    user: null,
    previewRole: null,
    error: null,
  });
}

/** Führt eine Store-Aktion inklusive ihrer simulierten Wartezeit aus. */
async function run(action: Promise<void>, ms = 2000) {
  await vi.advanceTimersByTimeAsync(ms);
  await action;
}

describe("auth store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("weist eine unvollständige E-Mail ab und räumt den Fehler beim Weitertippen weg", async () => {
    await run(useAuthStore.getState().submitEmail("kein-at-zeichen"));

    expect(useAuthStore.getState().step).toBe("identify");
    expect(useAuthStore.getState().error).toBe("Bitte gib eine gültige E-Mail-Adresse ein.");

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("geht von der E-Mail zum Passwort und verlangt auf unbekanntem Gerät den Code", async () => {
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    expect(useAuthStore.getState().step).toBe("password");

    await run(useAuthStore.getState().submitPassword("demo-passwort"));
    expect(useAuthStore.getState().step).toBe("twoFactor");
    expect(useAuthStore.getState().status).toBe("signed-out");
    expect(useAuthStore.getState().resendIn).toBeGreaterThan(0);
  });

  it("meldet mit richtigem Code an und merkt sich das Gerät", async () => {
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    await run(useAuthStore.getState().submitPassword("demo-passwort"));
    await run(useAuthStore.getState().submitTwoFactor(DEMO_TWO_FACTOR_CODE, true));

    const state = useAuthStore.getState();
    expect(state.status).toBe("signed-in");
    expect(state.user).toMatchObject({
      name: "Tom Beispiel",
      email: "tom.beispiel@firma.de",
      role: "admin",
    });
    expect(state.error).toBeNull();
    expect(localStorage.getItem("corva.session")).toContain("tom.beispiel@firma.de");
  });

  it("lehnt einen falschen Code ab, ohne den Schritt zu verlassen", async () => {
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    await run(useAuthStore.getState().submitPassword("demo-passwort"));
    await run(useAuthStore.getState().submitTwoFactor("000000", false));

    expect(useAuthStore.getState().status).toBe("signed-out");
    expect(useAuthStore.getState().step).toBe("twoFactor");
    expect(useAuthStore.getState().error).toContain("Code");
  });

  it("überspringt den Code auf einem vertrauten Gerät", async () => {
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    await run(useAuthStore.getState().submitPassword("demo-passwort"));
    await run(useAuthStore.getState().submitTwoFactor(DEMO_TWO_FACTOR_CODE, true));

    useAuthStore.getState().logout();
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    await run(useAuthStore.getState().submitPassword("demo-passwort"));

    expect(useAuthStore.getState().status).toBe("signed-in");
  });

  it("verlangt nach dem Start-Passwort ein eigenes", async () => {
    await run(useAuthStore.getState().submitEmail("neu.kollegin@firma.de"));
    await run(useAuthStore.getState().submitPassword(DEMO_INITIAL_PASSWORD));

    expect(useAuthStore.getState().step).toBe("setPassword");
  });

  it("führt den Passwort-Reset in den Bestätigungsschritt", async () => {
    await run(useAuthStore.getState().requestRecovery("tom.beispiel@firma.de"));

    expect(useAuthStore.getState().step).toBe("recoverSent");
    expect(useAuthStore.getState().email).toBe("tom.beispiel@firma.de");
  });

  it("speichert die Sitzung nicht, wenn 'Angemeldet bleiben' aus ist", async () => {
    useAuthStore.getState().setRememberMe(false);
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    await run(useAuthStore.getState().submitPassword("demo-passwort"));
    await run(useAuthStore.getState().submitTwoFactor(DEMO_TWO_FACTOR_CODE, false));

    expect(useAuthStore.getState().status).toBe("signed-in");
    expect(localStorage.getItem("corva.session")).toBeNull();
  });

  it("meldet ab und setzt den Ablauf zurück", async () => {
    await run(useAuthStore.getState().submitEmail("tom.beispiel@firma.de"));
    await run(useAuthStore.getState().submitPassword("demo-passwort"));
    await run(useAuthStore.getState().submitTwoFactor(DEMO_TWO_FACTOR_CODE, true));

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.status).toBe("signed-out");
    expect(state.step).toBe("identify");
    expect(state.user).toBeNull();
    expect(localStorage.getItem("corva.session")).toBeNull();
  });
});
