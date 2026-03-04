import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X, Pin } from "lucide-react";
import type { Message } from "@yxc/types";
import { MessageContent } from "./message-content";

interface PinnedMessagesProps {
  channelId: string;
  onClose: () => void;
}

function getUserColor(userId: string): string {
  const colors = ["#00f5c4","#22d3ee","#38bdf8","#c084fc","#f472b6","#fb923c","#fbbf24","#00d4aa"];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

export function PinnedMessages({ channelId, onClose }: PinnedMessagesProps) {
  const { data: pins = [], isLoading } = useQuery({
    queryKey: ["pins", channelId],
    queryFn: () => api.get<Message[]>(`/channels/${channelId}/pins`),
  });

  return (
    <div className="flex h-full w-[420px] flex-col border-l border-background-tertiary bg-background-primary">
      <div className="flex items-center justify-between border-b border-background-tertiary px-4 py-3">
        <div className="flex items-center gap-2">
          <Pin size={18} className="text-text-muted" />
          <h3 className="font-semibold text-header-primary">Pinned Messages</h3>
        </div>
        <button onClick={onClose} className="text-interactive-normal hover:text-interactive-hover" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Pin size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No pinned messages yet</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {pins.map((msg) => (
              <div key={msg.id} className="rounded-lg bg-background-secondary p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: getUserColor(msg.author.id) }}>
                    {msg.author.displayName ?? msg.author.username}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <MessageContent content={msg.content} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
