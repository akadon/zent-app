import { create } from "zustand";
import type { Guild, Channel, Member } from "@yxc/types";
import type { ReadyPayload } from "@yxc/gateway-types";
import { api } from "@/lib/api";
import { gateway } from "@/gateway/client";

interface GuildState {
  guilds: Guild[];
  selectedGuildId: string | null;
  selectedChannelId: string | null;
  channels: Map<string, Channel[]>;
  members: Map<string, Member[]>;
  typingUsers: Map<string, Map<string, number>>; // channelId -> userId -> timestamp
  readStates: Array<{ channelId: string; lastMessageId: string | null; mentionCount: number }>;

  setGuilds: (guilds: Guild[]) => void;
  selectGuild: (id: string | null) => void;
  selectChannel: (id: string | null) => void;
  setChannels: (guildId: string, channels: Channel[]) => void;
  setMembers: (guildId: string, members: Member[]) => void;
  addGuild: (guild: Guild) => void;
  removeGuild: (guildId: string) => void;
  updateGuild: (guild: Guild) => void;
  addChannel: (guildId: string, channel: Channel) => void;
  updateChannel: (channel: Channel) => void;
  removeChannel: (guildId: string, channelId: string) => void;
  setTyping: (channelId: string, userId: string) => void;
  clearTyping: (channelId: string, userId: string) => void;
  setReadStates: (states: Array<{ channelId: string; lastMessageId: string | null; mentionCount: number }>) => void;

  initGatewayHandlers: () => () => void;
}

export const useGuildStore = create<GuildState>((set, get) => ({
  guilds: [],
  selectedGuildId: null,
  selectedChannelId: null,
  channels: new Map(),
  members: new Map(),
  typingUsers: new Map(),
  readStates: [],

  setGuilds: (guilds) => set({ guilds }),
  selectGuild: (id) => set({ selectedGuildId: id, selectedChannelId: null }),
  selectChannel: (id) => set({ selectedChannelId: id }),
  setChannels: (guildId, channels) =>
    set((s) => {
      const newMap = new Map(s.channels);
      newMap.set(guildId, channels);
      return { channels: newMap };
    }),
  setMembers: (guildId, members) =>
    set((s) => {
      const newMap = new Map(s.members);
      newMap.set(guildId, members);
      return { members: newMap };
    }),
  addGuild: (guild) => set((s) => ({ guilds: [...s.guilds, guild] })),
  removeGuild: (guildId) =>
    set((s) => ({
      guilds: s.guilds.filter((g) => g.id !== guildId),
      selectedGuildId: s.selectedGuildId === guildId ? null : s.selectedGuildId,
    })),
  updateGuild: (guild) =>
    set((s) => ({
      guilds: s.guilds.map((g) => (g.id === guild.id ? { ...g, ...guild } : g)),
    })),
  addChannel: (guildId, channel) =>
    set((s) => {
      const newMap = new Map(s.channels);
      const existing = newMap.get(guildId) ?? [];
      newMap.set(guildId, [...existing, channel]);
      return { channels: newMap };
    }),
  updateChannel: (channel) =>
    set((s) => {
      if (!channel.guildId) return s;
      const newMap = new Map(s.channels);
      const existing = newMap.get(channel.guildId) ?? [];
      newMap.set(
        channel.guildId,
        existing.map((c) => (c.id === channel.id ? { ...c, ...channel } : c))
      );
      return { channels: newMap };
    }),
  removeChannel: (guildId, channelId) =>
    set((s) => {
      const newMap = new Map(s.channels);
      const existing = newMap.get(guildId) ?? [];
      newMap.set(
        guildId,
        existing.filter((c) => c.id !== channelId)
      );
      return {
        channels: newMap,
        selectedChannelId: s.selectedChannelId === channelId ? null : s.selectedChannelId,
      };
    }),
  setTyping: (channelId, userId) =>
    set((s) => {
      const newMap = new Map(s.typingUsers);
      if (!newMap.has(channelId)) newMap.set(channelId, new Map());
      newMap.get(channelId)!.set(userId, Date.now());
      return { typingUsers: newMap };
    }),
  clearTyping: (channelId, userId) =>
    set((s) => {
      const newMap = new Map(s.typingUsers);
      newMap.get(channelId)?.delete(userId);
      return { typingUsers: newMap };
    }),
  setReadStates: (states) => set({ readStates: states }),

  initGatewayHandlers: () => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      gateway.on("READY", (data: unknown) => {
        const ready = data as ReadyPayload;
        set({
          guilds: ready.guilds as Guild[],
          readStates: ready.readStates ?? [],
        });
      })
    );

    unsubs.push(
      gateway.on("GUILD_CREATE", (data: unknown) => {
        get().addGuild(data as Guild);
      })
    );

    unsubs.push(
      gateway.on("GUILD_UPDATE", (data: unknown) => {
        get().updateGuild(data as Guild);
      })
    );

    unsubs.push(
      gateway.on("GUILD_DELETE", (data: unknown) => {
        const { id } = data as { id: string };
        get().removeGuild(id);
      })
    );

    unsubs.push(
      gateway.on("CHANNEL_CREATE", (data: unknown) => {
        const channel = data as Channel;
        if (channel.guildId) get().addChannel(channel.guildId, channel);
      })
    );

    unsubs.push(
      gateway.on("CHANNEL_UPDATE", (data: unknown) => {
        get().updateChannel(data as Channel);
      })
    );

    unsubs.push(
      gateway.on("CHANNEL_DELETE", (data: unknown) => {
        const { id, guildId } = data as { id: string; guildId: string };
        get().removeChannel(guildId, id);
      })
    );

    unsubs.push(
      gateway.on("TYPING_START", (data: unknown) => {
        const { channelId, userId } = data as { channelId: string; userId: string };
        get().setTyping(channelId, userId);
        // Auto-clear after 10 seconds
        setTimeout(() => get().clearTyping(channelId, userId), 10000);
      })
    );

    return () => unsubs.forEach((fn) => fn());
  },
}));
