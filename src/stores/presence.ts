import { create } from "zustand";

interface PresenceData {
  status: "online" | "idle" | "dnd" | "offline";
  customStatus: { text?: string; emoji?: string } | null;
}

interface PresenceState {
  presences: Map<string, PresenceData>;

  getPresence: (userId: string) => PresenceData;
  setPresence: (userId: string, data: PresenceData) => void;
  bulkSetPresences: (entries: Array<{ userId: string; data: PresenceData }>) => void;
  // Kept for backward compat — now a no-op (presence hydrated from REST state)
  initPresenceHandlers: () => () => void;
}

const defaultPresence: PresenceData = { status: "offline", customStatus: null };

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presences: new Map(),

  getPresence: (userId) => get().presences.get(userId) ?? defaultPresence,

  setPresence: (userId, data) =>
    set((s) => {
      const newMap = new Map(s.presences);
      if (data.status === "offline") {
        newMap.delete(userId);
      } else {
        newMap.set(userId, data);
      }
      return { presences: newMap };
    }),

  bulkSetPresences: (entries) =>
    set((s) => {
      const newMap = new Map(s.presences);
      for (const { userId, data } of entries) {
        newMap.set(userId, data);
      }
      return { presences: newMap };
    }),

  initPresenceHandlers: () => {
    // No-op — presence is hydrated from /users/@me/state in providers.tsx
    return () => {};
  },
}));
