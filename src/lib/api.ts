/** Echte Konten sind der Standard; nur der explizite Vorschau-Build ist Demo. */
export const SERVER_MODE = import.meta.env.VITE_AUTH_MODE !== "demo";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

let csrfToken: string | null = null;
let csrfRequest: Promise<void> | null = null;

export function initCsrf(token: string) { csrfToken = token; }
export function resetCsrf() { csrfToken = null; }

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  signal?: AbortSignal;
}

/** Ausschließlich gleich-originäre API; keine Tokens im Browser-Speicher. */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid API path");
  const method = options.method ?? "GET";
  if (method !== "GET" && !csrfToken) {
    csrfRequest ??= api<{ csrfToken: string }>("/auth/session")
      .then((session) => initCsrf(session.csrfToken))
      .finally(() => { csrfRequest = null; });
    await csrfRequest;
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(method !== "GET" ? { "Content-Type": "application/json", "X-CSRF-Token": csrfToken! } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Der Server ist nicht erreichbar. Bitte prüfe die Verbindung und versuche es erneut.", 0);
  }

  let data: unknown;
  try { data = await response.json(); }
  catch { throw new ApiError("Der Server hat keine gültige Antwort geliefert. Bitte versuche es erneut.", response.status); }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      resetCsrf();
      window.dispatchEvent(new Event("corva:unauthorized"));
    }
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message : "Die Aktion konnte nicht ausgeführt werden. Bitte versuche es erneut.";
    throw new ApiError(message, response.status);
  }
  if (path === "/auth/session" && data && typeof data === "object" && "csrfToken" in data && typeof data.csrfToken === "string") {
    initCsrf(data.csrfToken);
  }
  return data as T;
}
