import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installLocalStorageStub } from "@/test/localStorageStub";

installLocalStorageStub();

/*
  Der Hinweis auf Demo-Daten hängt am Modus, und der Modus wird beim Laden
  der Module festgelegt. Beide Fassungen werden deshalb einzeln geladen.
*/
async function renderPanel(mode: "demo" | "server", path: string) {
  vi.resetModules();
  vi.stubEnv("VITE_AUTH_MODE", mode);
  const { ContextPanel } = await import("./ContextPanel");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderToString(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ContextPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Kontextspalte", () => {
  it("weist in der Demo-Fassung auf die Beispieldaten hin", async () => {
    const html = await renderPanel("demo", "/app/contacts");

    expect(html).toContain("Demo-Daten");
  });

  it("lässt den Hinweis weg, sobald die Daten vom Server kommen", async () => {
    const html = await renderPanel("server", "/app/contacts");

    expect(html).not.toContain("Demo-Daten");
  });

  it("zeigt auf der Übersicht das Team statt des Hinweises", async () => {
    const html = await renderPanel("demo", "/app");

    expect(html).toContain("Team");
    expect(html).not.toContain("Demo-Daten");
  });
});
