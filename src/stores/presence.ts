import { create } from "zustand";
import { gateway } from "@/gateway/client";
import type { ReadyPayload, GuildCreatePayload } from "@yxc/gateway-types";

// TODO: Presence dispatch to DM participants is not yet implemented on the backend.
// Once the server sends PRESENCE_UPDATE for DM participants, the client will
// automatically pick them up via the PRESENCE_UPDATE handler below.

interface PresenceData {
  status: "online" | "idle" | "dnd" | "offline";
  customStatus: { text?: string; emoji?: string } | null;
}

interface PresenceState {
  presences: Map<string, PresenceData>;

  getPresence: (userId: string) => PresenceData;
  setPresence: (userId: string, data: PresenceData) => void;
  bulkSetPresences: (entries: Array<{ userId: string; data: PresenceData }>) => void;
  initPresenceHandlers: () => () => void;
}

const defaultPresence: PresenceData = { status: "offline", customStatus: null };

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presences: new Map(),

  getPresence: (userId) => get().presences.get(userId) ?? defaultPresence,

  setPresence: (userId, data) =>
    set((s) => {
      const newMap = new Map(s.presences);
      // Remove offline users to prevent unbounded growth
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
    const unsubs: (() => void)[] = [];

    unsubs.push(
      gateway.on("PRESENCE_UPDATE", (data: unknown) => {
        const { userId, status, customStatus } = data as {
          userId: string;
          status: string;
          customStatus: { text?: string; emoji?: string } | null;
        };
        get().setPresence(userId, {
          status: status as PresenceData["status"],
          customStatus: customStatus ?? null,
        });
      })
    );

    unsubs.push(
      gateway.on("READY", (data: unknown) => {
        const ready = data as ReadyPayload;
        const entries: Array<{ userId: string; data: PresenceData }> = [];

        for (const guild of ready.guilds as GuildCreatePayload[]) {
          if (!guild.members) continue;
          for (const member of guild.members) {
            const user = member.user;
            if (user && user.status && user.status !== "offline") {
              entries.push({
                userId: user.id,
                data: {
                  status: user.status as PresenceData["status"],
                  customStatus: user.customStatus ?? null,
                },
              });
            }
          }
        }

        if (entries.length > 0) {
          get().bulkSetPresences(entries);
        }
      })
    );

    return () => unsubs.forEach((fn) => fn());
  },
}));
