/**
 * Guild gateway event handler.
 * Registers Socket.IO gateway listeners for guild/user events.
 * Applies incoming events to Zustand stores + React Query cache.
 */
import { gateway } from "@/gateway/client";
import { useGuildStore } from "@/stores/guild";
import type { QueryClient } from "@tanstack/react-query";
import type { Guild, Channel, Member, Message, VoiceState } from "@yxc/types";

const EVENT_TYPES = [
  "GUILD_CREATE", "GUILD_UPDATE", "GUILD_DELETE",
  "CHANNEL_CREATE", "CHANNEL_UPDATE", "CHANNEL_DELETE",
  "GUILD_MEMBER_ADD", "GUILD_MEMBER_REMOVE", "GUILD_MEMBER_UPDATE",
  "MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_DELETE_BULK",
  "MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE", "MESSAGE_REACTION_REMOVE_ALL",
  "CHANNEL_PINS_UPDATE", "MESSAGE_POLL_VOTE_ADD", "MESSAGE_POLL_VOTE_REMOVE",
  "VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE",
  "RELATIONSHIP_ADD", "RELATIONSHIP_REMOVE",
  "SESSION_INVALIDATE",
  "GUILD_STICKERS_UPDATE", "GUILD_EMOJIS_UPDATE",
  "GUILD_ROLE_CREATE", "GUILD_ROLE_UPDATE", "GUILD_ROLE_DELETE",
  "GUILD_BAN_ADD", "GUILD_BAN_REMOVE",
  "INVITE_CREATE", "INVITE_DELETE",
  "WEBHOOKS_UPDATE",
  "THREAD_CREATE", "THREAD_UPDATE", "THREAD_DELETE",
  "GUILD_AUDIT_LOG_ENTRY_CREATE",
  "AUTO_MODERATION_RULE_UPDATE", "AUTO_MODERATION_ACTION_EXECUTION",
  "GUILD_SCHEDULED_EVENT_CREATE", "GUILD_SCHEDULED_EVENT_UPDATE", "GUILD_SCHEDULED_EVENT_DELETE",
  "POLL_VOTE_ADD", "POLL_VOTE_REMOVE", "POLL_END",
] as const;

function handleEvent(type: string, data: any, queryClient: QueryClient) {
  const store = useGuildStore;

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
    case "VOICE_SERVER_UPDATE":
      if (data.token && data.endpoint) {
        const conn = store.getState().voiceConnection;
        if (conn) {
          store.getState().connectToLiveKit(data.token, data.endpoint);
        }
      }
      break;
    case "RELATIONSHIP_ADD":
    case "RELATIONSHIP_REMOVE":
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      break;
    case "SESSION_INVALIDATE":
      window.location.href = "/";
      break;
    case "GUILD_STICKERS_UPDATE":
    case "GUILD_EMOJIS_UPDATE":
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
 * Register gateway event handlers.
 * Called once from providers.tsx on auth.
 * Returns cleanup function.
 */
export function initGuildService(queryClient: QueryClient): () => void {
  const cleanups: (() => void)[] = [];

  for (const eventType of EVENT_TYPES) {
    const cleanup = gateway.on(eventType, (data) => {
      handleEvent(eventType, data, queryClient);
    });
    cleanups.push(cleanup);
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
