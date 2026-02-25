/**
 * Guild + user polling service.
 * Polls event logs for changes, applies to stores + React Query cache.
 * Replaces gateway push model.
 *
 * Guild polls: adaptive 3-15s, CF-cacheable per guild.
 * User polls: 30s (conditional — only when DM tab active or every 6th cycle as fallback).
 */
import { api } from "@/lib/api";
import { useGuildStore } from "@/stores/guild";
import { useUIStore } from "@/stores/ui";
import type { QueryClient } from "@tanstack/react-query";
import type { Guild, Channel, Member, Message, VoiceState } from "@yxc/types";

let lastGuildPollTime = Date.now();
let lastUserPollTime = Date.now();
let pollCycle = 0;

interface PollEvent {
  event: string;
  data: any;
}

function applyEvent(event: PollEvent, queryClient: QueryClient) {
  const store = useGuildStore;
  const { event: type, data } = event;

  switch (type) {
    case "GUILD_CREATE":
      store.getState().addGuild(data as Guild);
      break;
    case "GUILD_UPDATE":
      store.getState().updateGuild(data as Guild);
      break;
    case "GUILD_DELETE":
      store.getState().removeGuild(data.id);
      break;
    case "CHANNEL_CREATE":
      if (data.guildId) store.getState().addChannel(data.guildId, data as Channel);
      break;
    case "CHANNEL_UPDATE":
      store.getState().updateChannel(data as Channel);
      break;
    case "CHANNEL_DELETE":
      store.getState().removeChannel(data.guildId, data.id);
      break;
    case "GUILD_MEMBER_ADD": {
      const member = data as Member & { guildId: string };
      store.setState((s) => {
        const newMap = new Map(s.members);
        const existing = newMap.get(member.guildId) ?? [];
        if (!existing.some((m) => m.user?.id === member.user?.id)) {
          newMap.set(member.guildId, [...existing, member]);
        }
        return { members: newMap };
      });
      break;
    }
    case "GUILD_MEMBER_REMOVE": {
      const { guildId, userId } = data as { guildId: string; userId: string };
      store.setState((s) => {
        const newMap = new Map(s.members);
        const existing = newMap.get(guildId) ?? [];
        newMap.set(guildId, existing.filter((m) => m.user?.id !== userId));
        return { members: newMap };
      });
      break;
    }
    case "GUILD_MEMBER_UPDATE": {
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
      break;
    }
    case "MESSAGE_CREATE": {
      const msg = data as Message;
      queryClient.setQueryData(["messages", msg.channelId], (old: any) => {
        if (!old) return old;
        const allMessages = old.pages.flatMap((p: Message[]) => p);
        if (allMessages.some((m: Message) => m.id === msg.id)) return old;
        const newPages = [...old.pages];
        newPages[0] = [msg, ...newPages[0]];
        return { ...old, pages: newPages };
      });
      break;
    }
    case "MESSAGE_UPDATE": {
      const update = data as { id: string; channelId: string; content: string; editedTimestamp: string };
      queryClient.setQueryData(["messages", update.channelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Message[]) =>
            page.map((msg) =>
              msg.id === update.id
                ? { ...msg, content: update.content, editedTimestamp: update.editedTimestamp }
                : msg
            )
          ),
        };
      });
      break;
    }
    case "MESSAGE_DELETE": {
      const del = data as { id: string; channelId: string };
      queryClient.setQueryData(["messages", del.channelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Message[]) =>
            page.filter((msg) => msg.id !== del.id)
          ),
        };
      });
      break;
    }
    case "MESSAGE_DELETE_BULK": {
      const bulk = data as { ids: string[]; channelId: string };
      const idSet = new Set(bulk.ids);
      queryClient.setQueryData(["messages", bulk.channelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Message[]) =>
            page.filter((msg) => !idSet.has(msg.id))
          ),
        };
      });
      break;
    }
    case "MESSAGE_REACTION_ADD":
    case "MESSAGE_REACTION_REMOVE":
    case "MESSAGE_REACTION_REMOVE_ALL":
    case "CHANNEL_PINS_UPDATE":
    case "MESSAGE_POLL_VOTE_ADD":
    case "MESSAGE_POLL_VOTE_REMOVE": {
      const channelId = data.channelId;
      if (channelId) {
        queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
      }
      break;
    }
    case "VOICE_STATE_UPDATE": {
      const state = data as VoiceState;
      store.setState((s) => {
        const newMap = new Map(s.voiceStates);
        for (const [chId, states] of newMap) {
          const filtered = states.filter((vs) => vs.userId !== state.userId);
          if (filtered.length !== states.length) {
            if (filtered.length === 0) newMap.delete(chId);
            else newMap.set(chId, filtered);
          }
        }
        if (state.channelId) {
          const existing = newMap.get(state.channelId) ?? [];
          newMap.set(state.channelId, [...existing, state]);
        }
        return { voiceStates: newMap };
      });
      break;
    }
    case "RELATIONSHIP_ADD":
    case "RELATIONSHIP_REMOVE":
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      break;
    case "VOICE_SERVER_UPDATE":
      if (data.token && data.endpoint) {
        store.getState().setVoiceConnection({
          guildId: data.guildId,
          channelId: data.channelId,
          token: data.token,
          endpoint: data.endpoint,
        });
      }
      break;
    case "SESSION_INVALIDATE":
      window.location.href = "/";
      break;
    case "GUILD_STICKERS_UPDATE":
    case "GUILD_EMOJIS_UPDATE":
      // Refresh guild data
      queryClient.invalidateQueries({ queryKey: ["guild", data.guildId] });
      break;
    case "GUILD_ROLE_CREATE":
    case "GUILD_ROLE_UPDATE":
    case "GUILD_ROLE_DELETE":
      queryClient.invalidateQueries({ queryKey: ["roles", data.guildId] });
      break;
    case "GUILD_BAN_ADD":
    case "GUILD_BAN_REMOVE":
      queryClient.invalidateQueries({ queryKey: ["bans", data.guildId] });
      break;
    case "INVITE_CREATE":
    case "INVITE_DELETE":
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      break;
    case "WEBHOOKS_UPDATE":
      queryClient.invalidateQueries({ queryKey: ["webhooks", data.channelId] });
      break;
    case "THREAD_CREATE":
    case "THREAD_UPDATE":
    case "THREAD_DELETE":
      if (data.parentId) {
        queryClient.invalidateQueries({ queryKey: ["threads", data.parentId] });
      }
      break;
    case "GUILD_AUDIT_LOG_ENTRY_CREATE":
      queryClient.invalidateQueries({ queryKey: ["auditlog", data.guildId] });
      break;
    case "AUTO_MODERATION_RULE_UPDATE":
    case "AUTO_MODERATION_ACTION_EXECUTION":
      queryClient.invalidateQueries({ queryKey: ["automod", data.guildId] });
      break;
    case "GUILD_SCHEDULED_EVENT_CREATE":
    case "GUILD_SCHEDULED_EVENT_UPDATE":
    case "GUILD_SCHEDULED_EVENT_DELETE":
      queryClient.invalidateQueries({ queryKey: ["events", data.guildId] });
      break;
    case "POLL_VOTE_ADD":
    case "POLL_VOTE_REMOVE":
    case "POLL_END":
      if (data.channelId) {
        queryClient.invalidateQueries({ queryKey: ["messages", data.channelId] });
      }
      break;
  }
}

/**
 * Start polling guilds + user events.
 * Called once from providers.tsx on auth.
 * Returns cleanup function.
 */
export function initGuildPolling(queryClient: QueryClient): () => void {
  let running = true;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  async function poll() {
    if (!running) return;

    const guilds = useGuildStore.getState().guilds;
    pollCycle++;

    try {
      // Guild event polls (CF-cached per guild)
      const guildPolls = guilds.map((g) =>
        api.get<{ events: PollEvent[]; serverTime: number }>(
          `/guilds/${g.id}/poll?since=${lastGuildPollTime}`
        )
      );

      // User poll: only when DM view active OR every 6th cycle as fallback (~30s at 5s interval)
      const inDMView = useUIStore.getState().selectedGuildId === null;
      const shouldPollUser = inDMView || pollCycle % 6 === 0;

      const userPoll = shouldPollUser
        ? api.get<{ events: PollEvent[]; serverTime: number }>(
            `/users/@me/poll?since=${lastUserPollTime}`
          ).catch(() => null)
        : Promise.resolve(null);

      const [guildResults, userResult] = await Promise.all([
        Promise.allSettled(guildPolls),
        userPoll,
      ]);

      let maxGuildTime = lastGuildPollTime;
      for (const result of guildResults) {
        if (result.status === "fulfilled" && result.value.events.length > 0) {
          for (const event of result.value.events) {
            applyEvent(event, queryClient);
          }
          if (result.value.serverTime > maxGuildTime) {
            maxGuildTime = result.value.serverTime;
          }
        }
      }
      lastGuildPollTime = maxGuildTime;

      if (userResult && userResult.events.length > 0) {
        for (const event of userResult.events) {
          applyEvent(event, queryClient);
        }
        if (userResult.serverTime > lastUserPollTime) {
          lastUserPollTime = userResult.serverTime;
        }
      }
    } catch {
      // Network error — retry next cycle
    }

    if (running) {
      const base = api.pollInterval;
      const interval = document.hidden ? base * 5 : base;
      timeoutId = setTimeout(poll, interval);
    }
  }

  timeoutId = setTimeout(poll, 2000);

  return () => {
    running = false;
    if (timeoutId) clearTimeout(timeoutId);
  };
}
