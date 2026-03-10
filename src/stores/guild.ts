// livekit-client ^2.9.0 — dynamically imported to avoid loading ~200KB upfront
import { create } from "zustand";
import type { Room as RoomType } from "livekit-client";
import type { Guild, Channel, Member, VoiceState } from "@yxc/types";
import { api } from "@/lib/api";

interface PendingVoiceServer {
  guildId: string;
  token: string;
  endpoint: string;
}

interface VoiceConnection {
  guildId: string;
  channelId: string;
  selfMute: boolean;
  selfDeaf: boolean;
  selfVideo: boolean;
  selfStream: boolean;
  livekitRoom: RoomType | null;
  livekitToken: string | null;
}

interface GuildState {
  // Data
  guilds: Guild[];
  channels: Map<string, Channel[]>;
  members: Map<string, Member[]>;
  typingUsers: Map<string, Map<string, number>>; // channelId -> userId -> timestamp
  readStates: Array<{ channelId: string; lastMessageId: string | null; mentionCount: number }>;
  voiceStates: Map<string, VoiceState[]>; // channelId -> VoiceState[]

  // Voice connection
  voiceConnection: VoiceConnection | null;
  pendingVoiceServer: PendingVoiceServer | null;

  // Data setters
  setGuilds: (guilds: Guild[]) => void;
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
  getVoiceStates: (channelId: string) => VoiceState[];
  setVoiceStates: (channelId: string, states: VoiceState[]) => void;

  // Voice connection methods
  setVoiceConnection: (conn: VoiceConnection | null) => void;
  toggleSelfMute: () => void;
  toggleSelfDeaf: () => void;
  toggleSelfVideo: () => void;
  toggleSelfStream: () => void;
  connectToLiveKit: (token: string, url: string) => Promise<void>;
  disconnectLiveKit: () => void;
  disconnectVoice: () => void;
  consumeVoiceServer: () => PendingVoiceServer | null;

  // Gateway init (kept for backward compat — new code uses services)
  initGatewayHandlers: () => () => void;
}

export const useGuildStore = create<GuildState>((set, get) => ({
  guilds: [],
  channels: new Map(),
  members: new Map(),
  typingUsers: new Map(),
  readStates: [],
  voiceStates: new Map(),
  voiceConnection: null,
  pendingVoiceServer: null,

  setGuilds: (guilds) => set({ guilds }),
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
    set((s) => {
      const channels = new Map(s.channels);
      const members = new Map(s.members);
      const voiceStates = new Map(s.voiceStates);
      // Clean voice states for channels belonging to this guild
      const guildChannels = channels.get(guildId) ?? [];
      for (const ch of guildChannels) {
        voiceStates.delete(ch.id);
      }
      channels.delete(guildId);
      members.delete(guildId);
      return {
        guilds: s.guilds.filter((g) => g.id !== guildId),
        channels,
        members,
        voiceStates,
      };
    }),
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
      return { channels: newMap };
    }),
  setTyping: (channelId, userId) =>
    set((s) => {
      const newMap = new Map(s.typingUsers);
      if (!newMap.has(channelId)) newMap.set(channelId, new Map());
      newMap.get(channelId)!.set(userId, Date.now());
      // Prune stale typing indicators (>10s old)
      const now = Date.now();
      for (const [chId, users] of newMap) {
        for (const [uid, ts] of users) {
          if (now - ts > 10_000) users.delete(uid);
        }
        if (users.size === 0) newMap.delete(chId);
      }
      return { typingUsers: newMap };
    }),
  clearTyping: (channelId, userId) =>
    set((s) => {
      const newMap = new Map(s.typingUsers);
      newMap.get(channelId)?.delete(userId);
      if (newMap.get(channelId)?.size === 0) newMap.delete(channelId);
      return { typingUsers: newMap };
    }),
  setReadStates: (states) => set({ readStates: states }),
  getVoiceStates: (channelId) => get().voiceStates.get(channelId) ?? [],
  setVoiceStates: (channelId, states) =>
    set((s) => {
      const newMap = new Map(s.voiceStates);
      newMap.set(channelId, states);
      return { voiceStates: newMap };
    }),
  setVoiceConnection: (conn) => set({ voiceConnection: conn }),

  connectToLiveKit: async (token: string, url: string) => {
    const conn = get().voiceConnection;
    if (!conn) return;

    if (conn.livekitRoom) {
      conn.livekitRoom.disconnect();
    }

    const { Room, RoomEvent } = await import("livekit-client");

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    const bump = () => {
      const current = get().voiceConnection;
      if (current?.livekitRoom === room) {
        set({ voiceConnection: { ...current } });
      }
    };

    room.on(RoomEvent.ParticipantConnected, bump);
    room.on(RoomEvent.ParticipantDisconnected, bump);
    room.on(RoomEvent.TrackSubscribed, bump);
    room.on(RoomEvent.TrackUnsubscribed, bump);
    room.on(RoomEvent.TrackMuted, bump);
    room.on(RoomEvent.TrackUnmuted, bump);
    room.on(RoomEvent.LocalTrackPublished, bump);
    room.on(RoomEvent.LocalTrackUnpublished, bump);
    room.on(RoomEvent.Disconnected, () => {
      const current = get().voiceConnection;
      if (current?.livekitRoom === room) {
        set({
          voiceConnection: {
            ...current,
            livekitRoom: null,
            livekitToken: null,
            selfVideo: false,
            selfStream: false,
          },
        });
      }
    });

    try {
      await room.connect(url, token);

      if (conn.selfMute) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
      }

      set({
        voiceConnection: {
          ...get().voiceConnection!,
          livekitRoom: room,
          livekitToken: token,
        },
      });
    } catch (err) {
      console.error("LiveKit connection failed:", err);
      room.disconnect();
    }
  },

  disconnectLiveKit: () => {
    const conn = get().voiceConnection;
    if (!conn) return;
    if (conn.livekitRoom) {
      conn.livekitRoom.disconnect();
    }
    set({
      voiceConnection: {
        ...conn,
        livekitRoom: null,
        livekitToken: null,
        selfVideo: false,
        selfStream: false,
      },
    });
  },

  toggleSelfMute: () => {
    const conn = get().voiceConnection;
    if (!conn) return;
    const newMute = !conn.selfMute;
    set({ voiceConnection: { ...conn, selfMute: newMute } });
    if (conn.livekitRoom) {
      conn.livekitRoom.localParticipant.setMicrophoneEnabled(!newMute);
    }
  },

  toggleSelfDeaf: async () => {
    const conn = get().voiceConnection;
    if (!conn) return;
    const newDeaf = !conn.selfDeaf;
    const newMute = newDeaf ? true : conn.selfMute;
    set({ voiceConnection: { ...conn, selfDeaf: newDeaf, selfMute: newMute } });
    if (conn.livekitRoom) {
      const { Track } = await import("livekit-client");
      conn.livekitRoom.localParticipant.setMicrophoneEnabled(!newMute);
      for (const p of conn.livekitRoom.remoteParticipants.values()) {
        for (const pub of p.trackPublications.values()) {
          if (pub.track && pub.source === Track.Source.Microphone) {
            (pub.track as any).setEnabled?.(!newDeaf);
          }
        }
      }
    }
  },

  toggleSelfVideo: () => {
    const conn = get().voiceConnection;
    if (!conn?.livekitRoom) return;
    const newVideo = !conn.selfVideo;
    set({ voiceConnection: { ...conn, selfVideo: newVideo } });
    conn.livekitRoom.localParticipant.setCameraEnabled(newVideo);
  },

  toggleSelfStream: () => {
    const conn = get().voiceConnection;
    if (!conn?.livekitRoom) return;
    const newStream = !conn.selfStream;
    set({ voiceConnection: { ...conn, selfStream: newStream } });
    conn.livekitRoom.localParticipant.setScreenShareEnabled(newStream);
  },

  disconnectVoice: () => {
    const conn = get().voiceConnection;
    if (conn) {
      if (conn.livekitRoom) conn.livekitRoom.disconnect();
      api.post(`/voice/${conn.guildId}/leave`).catch(() => {});
    }
    set({ voiceConnection: null, pendingVoiceServer: null });
  },

  consumeVoiceServer: () => {
    const pending = get().pendingVoiceServer;
    set({ pendingVoiceServer: null });
    return pending;
  },

  // Backward compat — old code still calls this. New services handle it.
  initGatewayHandlers: () => {
    // No-op: services now handle gateway events.
    // Kept for backward compatibility with main-layout.tsx until Phase 2.
    return () => {};
  },
}));
