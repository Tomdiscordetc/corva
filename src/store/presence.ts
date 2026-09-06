import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PresenceStatus } from "@/lib/presence";

interface PresenceState {
  /** Eigener Status; bleibt auf diesem Gerät erhalten. */
  status: PresenceStatus;
  setStatus: (status: PresenceStatus) => void;
}

export const usePresenceStore = create<PresenceState>()(
  persist(
    (set) => ({
      status: "frei",
      setStatus: (status) => set({ status }),
    }),
    { name: "corva.presence" },
  ),
);
