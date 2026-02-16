"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, Trash2, X } from "lucide-react";
import type { ScheduledMessage } from "@yxc/types";

interface ScheduledMessagesPanelProps {
  channelId: string;
  onClose: () => void;
}

export function ScheduledMessagesPanel({ channelId, onClose }: ScheduledMessagesPanelProps) {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["scheduled-messages", channelId],
    queryFn: () => api.get<ScheduledMessage[]>(`/channels/${channelId}/scheduled-messages`),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`/channels/${channelId}/scheduled-messages/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-messages", channelId] });
    },
  });

  return (
    <div className="flex h-full w-[420px] flex-col border-l border-background-tertiary bg-background-primary">
      <div className="flex items-center justify-between border-b border-background-tertiary px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-text-muted" />
          <h3 className="font-semibold text-header-primary">Scheduled Messages</h3>
        </div>
        <button onClick={onClose} className="text-interactive-normal hover:text-interactive-hover">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Clock size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No scheduled messages</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-lg bg-background-secondary p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock size={12} />
                    {new Date(msg.scheduledFor).toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(msg.id)}
                    className="rounded p-1 text-text-muted hover:bg-background-primary hover:text-status-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-text-normal">{msg.content}</p>
                {msg.sent && (
                  <span className="mt-1 inline-block rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
                    Sent
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
