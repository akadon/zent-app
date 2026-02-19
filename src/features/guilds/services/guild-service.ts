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
    gateway.on("TYPING_START", (data: unknown) => {
      const { channelId, userId } = data as { channelId: string; userId: string };
      store.getState().setTyping(channelId, userId);
      setTimeout(() => store.getState().clearTyping(channelId, userId), 10000);
    })
  );

  return () => unsubs.forEach((fn) => fn());
}
