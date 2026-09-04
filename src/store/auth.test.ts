import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./auth";

describe("auth store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAuthStore.setState({
      status: "signed-out",
      user: null,
      previewRole: null,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects incomplete credentials and clears the error while editing", async () => {
    const login = useAuthStore.getState().login("not-an-email", "123");
    expect(useAuthStore.getState().status).toBe("authenticating");

    await vi.advanceTimersByTimeAsync(700);
    await login;

    expect(useAuthStore.getState().status).toBe("signed-out");
    expect(useAuthStore.getState().error).toBe("E-Mail oder Passwort ist falsch.");

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("signs valid demo credentials in", async () => {
    const login = useAuthStore.getState().login("tom.beispiel@firma.de", "demo-passwort");
    await vi.advanceTimersByTimeAsync(700);
    await login;

    const state = useAuthStore.getState();
    expect(state.status).toBe("signed-in");
    expect(state.user).toMatchObject({
      name: "Tom Beispiel",
      email: "tom.beispiel@firma.de",
      role: "admin",
    });
    expect(state.error).toBeNull();
  });
});
