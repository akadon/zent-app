// livekit-client ^2.9.0 — already in package.json
import { create } from "zustand";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import type { Guild, Channel, Member, VoiceState } from "@yxc/types";
import type { ReadyPayload, GuildCreatePayload } from "@yxc/gateway-types";
import { gateway } from "@/gateway/client";
import { usePresenceStore } from "@/stores/presence";

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
  livekitRoom: Room | null;
  livekitToken: string | null;
}

interface GuildState {
  guilds: Guild[];
  selectedGuildId: string | null;
  selectedChannelId: string | null;
  channels: Map<string, Channel[]>;
  members: Map<string, Member[]>;
  typingUsers: Map<string, Map<string, number>>; // channelId -> userId -> timestamp
  readStates: Array<{ channelId: string; lastMessageId: string | null; mentionCount: number }>;
  voiceStates: Map<string, VoiceState[]>; // channelId -> VoiceState[]
  voiceConnection: VoiceConnection | null;
  pendingVoiceServer: PendingVoiceServer | null;

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
  getVoiceStates: (channelId: string) => VoiceState[];
  setVoiceStates: (channelId: string, states: VoiceState[]) => void;
  setVoiceConnection: (conn: VoiceConnection | null) => void;
  toggleSelfMute: () => void;
  toggleSelfDeaf: () => void;
  toggleSelfVideo: () => void;
  toggleSelfStream: () => void;
  connectToLiveKit: (token: string, url: string) => Promise<void>;
  disconnectLiveKit: () => void;
  disconnectVoice: () => void;
  consumeVoiceServer: () => PendingVoiceServer | null;

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
  voiceStates: new Map(),
  voiceConnection: null,
  pendingVoiceServer: null,

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

    // Disconnect existing room if any
    if (conn.livekitRoom) {
      conn.livekitRoom.disconnect();
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    // Participant events trigger re-render via voiceConnection reference update
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

      // Apply current mute state after connect
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
    gateway.updateVoiceState(conn.guildId, conn.channelId, newMute, conn.selfDeaf);

    // Sync with LiveKit
    if (conn.livekitRoom) {
      conn.livekitRoom.localParticipant.setMicrophoneEnabled(!newMute);
    }
  },

  toggleSelfDeaf: () => {
    const conn = get().voiceConnection;
    if (!conn) return;
    const newDeaf = !conn.selfDeaf;
    const newMute = newDeaf ? true : conn.selfMute;
    set({ voiceConnection: { ...conn, selfDeaf: newDeaf, selfMute: newMute } });
    gateway.updateVoiceState(conn.guildId, conn.channelId, newMute, newDeaf);

    // Sync with LiveKit
    if (conn.livekitRoom) {
      conn.livekitRoom.localParticipant.setMicrophoneEnabled(!newMute);
      // Mute/unmute all remote audio when deafened
      for (const p of conn.livekitRoom.remoteParticipants.values()) {
        for (const pub of p.trackPublications.values()) {
          if (pub.track && pub.source === Track.Source.Microphone) {
            pub.track.setEnabled(!newDeaf);
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
      if (conn.livekitRoom) {
        conn.livekitRoom.disconnect();
      }
      gateway.updateVoiceState(conn.guildId, null);
    }
    set({ voiceConnection: null, pendingVoiceServer: null });
  },

  consumeVoiceServer: () => {
    const pending = get().pendingVoiceServer;
    set({ pendingVoiceServer: null });
    return pending;
  },

  initGatewayHandlers: () => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      gateway.on("READY", (data: unknown) => {
        const ready = data as ReadyPayload;
        const channelsMap = new Map<string, Channel[]>();
        const membersMap = new Map<string, Member[]>();
        const voiceStatesMap = new Map<string, VoiceState[]>();
        for (const guild of ready.guilds as GuildCreatePayload[]) {
          if (guild.channels) {
            channelsMap.set(guild.id, guild.channels);
          }
          if (guild.members) {
            membersMap.set(guild.id, guild.members);
          }
          if (guild.voiceStates) {
            for (const vs of guild.voiceStates) {
              if (!vs.channelId) continue;
              const existing = voiceStatesMap.get(vs.channelId) ?? [];
              existing.push(vs);
              voiceStatesMap.set(vs.channelId, existing);
            }
          }
        }
        set({
          guilds: ready.guilds as Guild[],
          readStates: ready.readStates ?? [],
          channels: channelsMap,
          members: membersMap,
          voiceStates: voiceStatesMap,
        });

        // Hydrate presence store from READY guild member data
        const presenceEntries: Array<{ userId: string; data: { status: "online" | "idle" | "dnd" | "offline"; customStatus: { text?: string; emoji?: string } | null } }> = [];
        for (const guild of ready.guilds as GuildCreatePayload[]) {
          if (!guild.members) continue;
          for (const member of guild.members) {
            const user = member.user;
            if (user && user.status && user.status !== "offline") {
              presenceEntries.push({
                userId: user.id,
                data: {
                  status: user.status,
                  customStatus: user.customStatus ?? null,
                },
              });
            }
          }
        }
        if (presenceEntries.length > 0) {
          usePresenceStore.getState().bulkSetPresences(presenceEntries);
        }
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

    unsubs.push(
      gateway.on("VOICE_SERVER_UPDATE", (data: unknown) => {
        const { guildId, token, endpoint } = data as { guildId: string; token: string; endpoint: string };
        set({ pendingVoiceServer: { guildId, token, endpoint } });
        // Auto-connect to LiveKit when we receive voice server info
        get().connectToLiveKit(token, endpoint);
      })
    );

    unsubs.push(
      gateway.on("VOICE_STATE_UPDATE", (data: unknown) => {
        const state = data as VoiceState;
        set((s) => {
          const newMap = new Map(s.voiceStates);

          // Remove user from any previous channel
          for (const [chId, states] of newMap) {
            const filtered = states.filter((vs) => vs.userId !== state.userId);
            if (filtered.length !== states.length) {
              if (filtered.length === 0) {
                newMap.delete(chId);
              } else {
                newMap.set(chId, filtered);
              }
            }
          }

          // Add user to new channel if they didn't disconnect
          if (state.channelId) {
            const existing = newMap.get(state.channelId) ?? [];
            newMap.set(state.channelId, [...existing, state]);
          }

          return { voiceStates: newMap };
        });
      })
    );

    // Invalidate relevant queries when webhooks change
    unsubs.push(
      gateway.on("WEBHOOKS_UPDATE", (_data: unknown) => {
        // Webhook updates are guild-scoped; components using webhook queries
        // should re-fetch. We store nothing in zustand for webhooks, so this
        // is a no-op until a webhook management UI is added.
      })
    );

    unsubs.push(
      gateway.on("GUILD_AUDIT_LOG_ENTRY_CREATE", (_data: unknown) => {
        // Audit log entries are append-only. No client-side cache to
        // invalidate right now — the audit log page fetches on demand.
      })
    );

    return () => unsubs.forEach((fn) => fn());
  },
}));
