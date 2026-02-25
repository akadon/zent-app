import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, Trash2, X, Plus, Send } from "lucide-react";
import type { ScheduledMessage } from "@yxc/types";

interface ScheduledMessagesPanelProps {
  channelId: string;
  onClose: () => void;
}

export function ScheduledMessagesPanel({ channelId, onClose }: ScheduledMessagesPanelProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

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

  const createMutation = useMutation({
    mutationFn: (body: { content: string; scheduledFor: string }) =>
      api.post(`/channels/${channelId}/scheduled-messages`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-messages", channelId] });
      setContent("");
      setScheduledAt("");
      setShowForm(false);
    },
  });

  const handleSubmit = () => {
    if (!content.trim() || !scheduledAt) return;
    createMutation.mutate({
      content: content.trim(),
      scheduledFor: new Date(scheduledAt).toISOString(),
    });
  };

  return (
    <div className="flex h-full w-[420px] flex-col border-l border-background-tertiary bg-background-primary">
      <div className="flex items-center justify-between border-b border-background-tertiary px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-text-muted" />
          <h3 className="font-semibold text-header-primary">Scheduled Messages</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded p-1 text-interactive-normal hover:text-interactive-hover hover:bg-background-modifier-hover"
            title="Schedule Message"
          >
            <Plus size={18} />
          </button>
          <button onClick={onClose} className="text-interactive-normal hover:text-interactive-hover">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Schedule message form */}
      {showForm && (
        <div className="border-b border-background-tertiary p-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Message content..."
            rows={3}
            className="w-full rounded-md bg-background-secondary px-3 py-2 text-sm text-text-normal placeholder-text-muted border border-background-tertiary focus:border-brand focus:outline-none resize-none"
          />
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-md bg-background-secondary px-3 py-2 text-sm text-text-normal border border-background-tertiary focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setContent("");
                setScheduledAt("");
              }}
              className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:text-text-normal transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || !scheduledAt || createMutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={14} />
              {createMutation.isPending ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Clock size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No scheduled messages</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs text-brand hover:underline"
            >
              Schedule one
            </button>
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
