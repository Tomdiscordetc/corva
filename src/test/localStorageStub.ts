/**
 * Minimaler Speicher-Ersatz für Tests: Vitest läuft ohne Browser, der Store
 * legt Sitzung und vertraute Geräte aber im `localStorage` ab.
 */
export function installLocalStorageStub() {
  if (typeof globalThis.localStorage !== "undefined") return;

  let store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, "localStorage", { value: stub, configurable: true });
}
