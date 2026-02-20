/**
 * Guild + Channel gateway handler registration.
 * Subscribes once on app mount. Updates the guild store + React Query cache.
 */
import { gateway } from "@/gateway/client";
import { useGuildStore } from "@/stores/guild";
import { usePresenceStore } from "@/stores/presence";
import type { Guild, Channel, Member, VoiceState } from "@yxc/types";
import type { ReadyPayload, GuildCreatePayload } from "@yxc/gateway-types";

export function initGuildHandlers(): () => void {
  const unsubs: (() => void)[] = [];
  const store = useGuildStore;
  const presenceStore = usePresenceStore;

  unsubs.push(
    gateway.on("READY", (data: unknown) => {
      const ready = data as ReadyPayload;
      const channelsMap = new Map<string, Channel[]>();
      const membersMap = new Map<string, Member[]>();
      const voiceStatesMap = new Map<string, VoiceState[]>();

      for (const guild of ready.guilds as GuildCreatePayload[]) {
        if (guild.channels) channelsMap.set(guild.id, guild.channels);
        if (guild.members) membersMap.set(guild.id, guild.members);
        if (guild.voiceStates) {
          for (const vs of guild.voiceStates) {
            if (!vs.channelId) continue;
            const existing = voiceStatesMap.get(vs.channelId) ?? [];
            existing.push(vs);
            voiceStatesMap.set(vs.channelId, existing);
          }
        }
      }

      store.setState({
        guilds: ready.guilds as Guild[],
        readStates: ready.readStates ?? [],
        channels: channelsMap,
        members: membersMap,
        voiceStates: voiceStatesMap,
      });

      // Hydrate presence from member data
      const presenceEntries: Array<{
        userId: string;
        data: { status: "online" | "idle" | "dnd" | "offline"; customStatus: { text?: string; emoji?: string } | null };
      }> = [];

      for (const guild of ready.guilds as GuildCreatePayload[]) {
        if (!guild.members) continue;
        for (const member of guild.members) {
          const user = member.user;
          if (user?.status && user.status !== "offline") {
            presenceEntries.push({
              userId: user.id,
              data: {
                status: user.status as any,
                customStatus: user.customStatus ?? null,
              },
            });
          }
        }
      }

      if (presenceEntries.length > 0) {
        presenceStore.getState().bulkSetPresences(presenceEntries);
      }
    })
  );

  unsubs.push(
    gateway.on("GUILD_CREATE", (data: unknown) => {
      store.getState().addGuild(data as Guild);
    })
  );

  unsubs.push(
    gateway.on("GUILD_UPDATE", (data: unknown) => {
      store.getState().updateGuild(data as Guild);
    })
  );

  unsubs.push(
    gateway.on("GUILD_DELETE", (data: unknown) => {
      const { id } = data as { id: string };
      store.getState().removeGuild(id);
    })
  );

  unsubs.push(
    gateway.on("CHANNEL_CREATE", (data: unknown) => {
      const channel = data as Channel;
      if (channel.guildId) store.getState().addChannel(channel.guildId, channel);
    })
  );

  unsubs.push(
    gateway.on("CHANNEL_UPDATE", (data: unknown) => {
      store.getState().updateChannel(data as Channel);
    })
  );

  unsubs.push(
    gateway.on("CHANNEL_DELETE", (data: unknown) => {
      const { id, guildId } = data as { id: string; guildId: string };
      store.getState().removeChannel(guildId, id);
    })
  );

  unsubs.push(
    gateway.on("GUILD_MEMBER_ADD", (data: unknown) => {
      const member = data as Member & { guildId: string };
      store.setState((s) => {
        const newMap = new Map(s.members);
        const existing = newMap.get(member.guildId) ?? [];
        if (!existing.some((m) => m.user?.id === member.user?.id)) {
          newMap.set(member.guildId, [...existing, member]);
        }
        return { members: newMap };
      });
    })
  );

  unsubs.push(
    gateway.on("GUILD_MEMBER_REMOVE", (data: unknown) => {
      const { guildId, userId } = data as { guildId: string; userId: string };
      store.setState((s) => {
        const newMap = new Map(s.members);
        const existing = newMap.get(guildId) ?? [];
        newMap.set(guildId, existing.filter((m) => m.user?.id !== userId));
        return { members: newMap };
      });
    })
  );

  unsubs.push(
    gateway.on("GUILD_MEMBER_UPDATE", (data: unknown) => {
      const updated = data as Member & { guildId: string };
      store.setState((s) => {
        const newMap = new Map(s.members);
        const existing = newMap.get(updated.guildId) ?? [];
        newMap.set(
          updated.guildId,
          existing.map((m) => (m.user?.id === updated.user?.id ? { ...m, ...updated } : m))
        );
        return { members: newMap };
      });
    })
  );

  const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  unsubs.push(
    gateway.on("TYPING_START", (data: unknown) => {
      const { channelId, userId } = data as { channelId: string; userId: string };
      store.getState().setTyping(channelId, userId);
      const key = `${channelId}:${userId}`;
      const existing = typingTimeouts.get(key);
      if (existing) clearTimeout(existing);
      typingTimeouts.set(
        key,
        setTimeout(() => {
          store.getState().clearTyping(channelId, userId);
          typingTimeouts.delete(key);
        }, 10000)
      );
    })
  );

  return () => {
    unsubs.forEach((fn) => fn());
    for (const t of typingTimeouts.values()) clearTimeout(t);
    typingTimeouts.clear();
  };
}
