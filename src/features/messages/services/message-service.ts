/**
 * Message gateway handler registration.
 * Subscribes once on app mount via providers.tsx. Updates React Query cache.
 */
import { gateway } from "@/gateway/client";
import type { QueryClient } from "@tanstack/react-query";
import type { Message } from "@yxc/types";
import { showLocalNotification } from "@/lib/notifications";
import { useAuthStore } from "@/stores/auth";

export function initMessageHandlers(queryClient: QueryClient): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(
    gateway.on("MESSAGE_CREATE", (data: unknown) => {
      const msg = data as Message;
      queryClient.setQueryData(
        ["messages", msg.channelId],
        (old: any) => {
          if (!old) return old;
          const allMessages = old.pages.flatMap((p: Message[]) => p);
          if (allMessages.some((m: Message) => m.id === msg.id)) return old;
          const newPages = [...old.pages];
          newPages[0] = [msg, ...newPages[0]];
          return { ...old, pages: newPages };
        }
      );

      // Desktop notification for background tab
      const currentUser = useAuthStore.getState().user;
      if (document.hidden && msg.author?.id !== currentUser?.id) {
        showLocalNotification(
          msg.author?.displayName ?? msg.author?.username ?? "New message",
          msg.content ?? ""
        );
      }
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_UPDATE", (data: unknown) => {
      const update = data as { id: string; channelId: string; content: string; editedTimestamp: string };
      queryClient.setQueryData(
        ["messages", update.channelId],
        (old: any) => {
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
        }
      );
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_DELETE", (data: unknown) => {
      const del = data as { id: string; channelId: string };
      queryClient.setQueryData(
        ["messages", del.channelId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.filter((msg) => msg.id !== del.id)
            ),
          };
        }
      );
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_DELETE_BULK", (data: unknown) => {
      const bulk = data as { ids: string[]; channelId: string };
      const idSet = new Set(bulk.ids);
      queryClient.setQueryData(
        ["messages", bulk.channelId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.filter((msg) => !idSet.has(msg.id))
            ),
          };
        }
      );
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_POLL_VOTE_ADD", (data: unknown) => {
      const vote = data as {
        channelId: string; messageId: string; optionId: string;
        userId: string; pollId: string; guildId: string | null;
      };
      const currentUser = useAuthStore.getState().user;
      queryClient.setQueryData(
        ["messages", vote.channelId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((msg) => {
                if (msg.id !== vote.messageId || !msg.poll) return msg;
                return {
                  ...msg,
                  poll: {
                    ...msg.poll,
                    totalVotes: msg.poll.totalVotes + 1,
                    options: msg.poll.options.map((opt: any) =>
                      opt.id === vote.optionId
                        ? {
                            ...opt,
                            votes: opt.votes + 1,
                            voted: opt.voted || vote.userId === currentUser?.id,
                          }
                        : opt
                    ),
                  },
                };
              })
            ),
          };
        }
      );
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_POLL_VOTE_REMOVE", (data: unknown) => {
      const vote = data as {
        channelId: string; messageId: string; optionId: string;
        userId: string; pollId: string; guildId: string | null;
      };
      const currentUser = useAuthStore.getState().user;
      queryClient.setQueryData(
        ["messages", vote.channelId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((msg) => {
                if (msg.id !== vote.messageId || !msg.poll) return msg;
                return {
                  ...msg,
                  poll: {
                    ...msg.poll,
                    totalVotes: Math.max(0, msg.poll.totalVotes - 1),
                    options: msg.poll.options.map((opt: any) =>
                      opt.id === vote.optionId
                        ? {
                            ...opt,
                            votes: Math.max(0, opt.votes - 1),
                            voted: vote.userId === currentUser?.id ? false : opt.voted,
                          }
                        : opt
                    ),
                  },
                };
              })
            ),
          };
        }
      );
    })
  );

  unsubs.push(
    gateway.on("CHANNEL_PINS_UPDATE", (data: unknown) => {
      const pins = data as { channelId: string };
      queryClient.invalidateQueries({ queryKey: ["pins", pins.channelId] });
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_REACTION_ADD", (data: unknown) => {
      const reaction = data as {
        channelId: string; messageId: string; userId: string;
        emoji: { id?: string; name: string };
      };
      const currentUser = useAuthStore.getState().user;
      queryClient.setQueryData(
        ["messages", reaction.channelId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((msg) => {
                if (msg.id !== reaction.messageId) return msg;
                const reactions = [...(msg.reactions ?? [])];
                const existing = reactions.find(
                  (r: any) => r.emoji?.name === reaction.emoji.name && r.emoji?.id === reaction.emoji.id
                );
                if (existing) {
                  existing.count = (existing.count ?? 0) + 1;
                  if (reaction.userId === currentUser?.id) existing.me = true;
                } else {
                  reactions.push({
                    emoji: reaction.emoji,
                    count: 1,
                    me: reaction.userId === currentUser?.id,
                  });
                }
                return { ...msg, reactions };
              })
            ),
          };
        }
      );
    })
  );

  unsubs.push(
    gateway.on("MESSAGE_REACTION_REMOVE", (data: unknown) => {
      const reaction = data as {
        channelId: string; messageId: string; userId: string;
        emoji: { id?: string; name: string };
      };
      const currentUser = useAuthStore.getState().user;
      queryClient.setQueryData(
        ["messages", reaction.channelId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Message[]) =>
              page.map((msg) => {
                if (msg.id !== reaction.messageId) return msg;
                let reactions = [...(msg.reactions ?? [])];
                const existing = reactions.find(
                  (r: any) => r.emoji?.name === reaction.emoji.name && r.emoji?.id === reaction.emoji.id
                );
                if (existing) {
                  existing.count = Math.max(0, (existing.count ?? 1) - 1);
                  if (reaction.userId === currentUser?.id) existing.me = false;
                  if (existing.count === 0) {
                    reactions = reactions.filter((r: any) => r !== existing);
                  }
                }
                return { ...msg, reactions };
              })
            ),
          };
        }
      );
    })
  );

  return () => unsubs.forEach((fn) => fn());
}
