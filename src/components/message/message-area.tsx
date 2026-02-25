import { useState, useRef, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { api } from "@/lib/api";
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import type { Message, Channel } from "@yxc/types";
import { Pin, Calendar, Search, MoreHorizontal } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { PinnedMessages } from "./pinned-messages";
import { ScheduledMessagesPanel } from "./scheduled-messages-panel";
import { NoMessagesState } from "@/components/ui/empty-state";
import { SearchPanel } from "@/components/search/search-panel";
import { cn } from "@/lib/utils";

interface MessageAreaProps {
  channelId: string;
  guildId: string | null;
}

export function MessageArea({ channelId, guildId }: MessageAreaProps) {
  const queryClient = useQueryClient();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { openModal } = useUIStore();
  const guilds = useGuildStore((s) => s.guilds);
  const currentGuild = guildId ? guilds.find((g) => g.id === guildId) : null;

  // Fetch channel info for the header
  const { data: channelInfo } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => api.get<Channel>(`/channels/${channelId}`),
  });

  // Fetch messages with cursor-based pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["messages", channelId],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?before=${pageParam}&limit=50` : "?limit=50";
      return api.get<Message[]>(`/channels/${channelId}/messages${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined;
      return lastPage[lastPage.length - 1]?.id;
    },
  });

  const messages = (data?.pages.flatMap((p) => p) ?? []).reverse();

  // Send message
  const sendMessage = useMutation({
    mutationFn: ({ content, replyTo }: { content: string; replyTo?: string }) =>
      api.post<Message>(`/channels/${channelId}/messages`, {
        content,
        ...(replyTo ? { messageReference: { messageId: replyTo } } : {}),
      }),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ["messages", channelId],
        (old: any) => {
          if (!old) return { pages: [[newMessage]], pageParams: [undefined] };
          const newPages = [...old.pages];
          newPages[0] = [newMessage, ...newPages[0]];
          return { ...old, pages: newPages };
        }
      );
      setShouldAutoScroll(true);
    },
  });

  // Gateway handlers for messages are centralized in message-service.ts
  // and initialized once in providers.tsx. No per-component subscriptions needed.

  // Compute firstItemIndex for stable prepend (Virtuoso needs this)
  const START_INDEX = 100000;
  const firstItemIndex = useMemo(() => START_INDEX - messages.length, [messages.length]);

  return (
    <div className="flex flex-1 flex-col bg-background-primary">
      {/* Channel action bar - minimal since main layout has breadcrumb */}
      <div className={cn(
        "flex h-11 items-center justify-between px-4",
        "border-b border-surface-border/30",
        "bg-background-primary/50"
      )}>
        {/* Left: Channel topic if exists */}
        <div className="flex-1 min-w-0">
          {channelInfo?.topic && (
            <p className="truncate text-sm text-text-muted/80 italic">
              {channelInfo.topic}
            </p>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-0.5">
          <ActionButton
            icon={<Pin size={16} />}
            tooltip="Pinned Messages"
            isActive={showPinned}
            onClick={() => setShowPinned(!showPinned)}
          />
          <ActionButton
            icon={<Calendar size={16} />}
            tooltip="Scheduled"
            isActive={showScheduled}
            onClick={() => setShowScheduled(!showScheduled)}
          />
          <ActionButton
            icon={<Search size={16} />}
            tooltip="Search"
            isActive={showSearch}
            onClick={() => setShowSearch(!showSearch)}
          />
          <ActionButton
            icon={<MoreHorizontal size={16} />}
            tooltip="More"
            onClick={() => openModal("invitePeople", { channelId, guildName: currentGuild?.name ?? "" })}
          />
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Main message area */}
        <div className="flex flex-1 flex-col">
          {/* Side panels */}
          {showPinned && (
            <div className="animate-slide-in-right absolute right-0 top-0 z-20 h-full">
              <PinnedMessages channelId={channelId} onClose={() => setShowPinned(false)} />
            </div>
          )}
          {showScheduled && (
            <div className="animate-slide-in-right absolute right-0 top-0 z-20 h-full">
              <ScheduledMessagesPanel channelId={channelId} onClose={() => setShowScheduled(false)} />
            </div>
          )}
          {showSearch && guildId && (
            <div className="animate-slide-in-right absolute right-0 top-0 z-20 h-full">
              <SearchPanel guildId={guildId} onClose={() => setShowSearch(false)} onNavigate={() => setShowSearch(false)} />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            {isLoading && (
              <div className="py-4 overflow-y-auto h-full scrollbar-thin">
                {Array.from({ length: 8 }).map((_, i) => (
                  <MessageSkeleton key={i} delay={i * 100} />
                ))}
              </div>
            )}

            {!isLoading && messages.length === 0 && (
              <div className="animate-fade-in-up h-full flex items-center justify-center">
                <NoMessagesState channelName={channelInfo?.name ?? undefined} />
              </div>
            )}

            {!isLoading && messages.length > 0 && (
              <Virtuoso
                ref={virtuosoRef}
                className="scrollbar-thin h-full"
                data={messages}
                firstItemIndex={firstItemIndex}
                initialTopMostItemIndex={messages.length - 1}
                followOutput="smooth"
                atTopStateChange={(atTop) => {
                  if (atTop && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                atBottomStateChange={(atBottom) => setShouldAutoScroll(atBottom)}
                components={{
                  Header: () =>
                    isFetchingNextPage ? (
                      <div className="flex justify-center py-4">
                        <div className="spinner-brand h-6 w-6" />
                      </div>
                    ) : null,
                }}
                itemContent={(index, message) => {
                  const actualIndex = index - firstItemIndex;
                  const prev = actualIndex > 0 ? messages[actualIndex - 1] : undefined;
                  const isCompact =
                    prev &&
                    prev.author.id === message.author.id &&
                    new Date(message.createdAt).getTime() -
                      new Date(prev.createdAt).getTime() <
                      7 * 60 * 1000;

                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isCompact={!!isCompact}
                      onReply={(msg) => setReplyingTo(msg)}
                    />
                  );
                }}
              />
            )}
          </div>

          {/* Typing indicator */}
          <TypingIndicator channelId={channelId} />

          {/* Message input */}
          <MessageInput
            channelId={channelId}
            onSend={(content, replyTo) => sendMessage.mutate({ content, replyTo })}
            disabled={sendMessage.isPending}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  tooltip,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  tooltip: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        "transition-all duration-200",
        isActive
          ? "bg-brand/15 text-brand-light"
          : "text-text-muted hover:bg-background-hover/60 hover:text-text-normal",
        "active:scale-90"
      )}
      title={tooltip}
    >
      {icon}
    </button>
  );
}
