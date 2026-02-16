import { create } from "zustand";
import { gateway } from "@/gateway/client";

interface PresenceData {
  status: "online" | "idle" | "dnd" | "offline";
  customStatus: { text?: string; emoji?: string } | null;
}

interface PresenceState {
  presences: Map<string, PresenceData>;

  getPresence: (userId: string) => PresenceData;
  setPresence: (userId: string, data: PresenceData) => void;
  initPresenceHandlers: () => () => void;
}

const defaultPresence: PresenceData = { status: "offline", customStatus: null };

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presences: new Map(),

  getPresence: (userId) => get().presences.get(userId) ?? defaultPresence,

  setPresence: (userId, data) =>
    set((s) => {
      const newMap = new Map(s.presences);
      newMap.set(userId, data);
      return { presences: newMap };
    }),

  initPresenceHandlers: () => {
    const unsub = gateway.on("PRESENCE_UPDATE", (data: unknown) => {
      const { userId, status, customStatus } = data as {
        userId: string;
        status: string;
        customStatus: { text?: string; emoji?: string } | null;
      };
      get().setPresence(userId, {
        status: status as PresenceData["status"],
        customStatus: customStatus ?? null,
      });
    });

    return unsub;
  },
}));
