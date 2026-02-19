"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import type { Channel } from "@yxc/types";

export function ChannelSettingsModal() {
  const { modalData, closeModal } = useUIStore();
  const channelId = modalData.channelId as string | undefined;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");

  const { data: channel } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => api.get<Channel>(`/channels/${channelId}`),
    enabled: !!channelId,
  });

  useEffect(() => {
    if (channel) {
      setName(channel.name ?? "");
      setTopic((channel as any).topic ?? "");
    }
  }, [channel]);

  const updateChannel = useMutation({
    mutationFn: () => api.patch(`/channels/${channelId}`, { name: name || undefined, topic: topic || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Channel updated");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to update channel"),
  });

  const deleteChannel = useMutation({
    mutationFn: () => api.delete(`/channels/${channelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Channel deleted");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to delete channel"),
  });

  if (!channelId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-header-primary">Channel Settings</h2>
        <div className="mb-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              maxLength={1024}
              className="w-full resize-none rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this channel?")) deleteChannel.mutate();
            }}
            className="text-sm text-red hover:underline"
          >
            Delete Channel
          </button>
          <div className="flex gap-3">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-normal">Cancel</button>
            <button
              onClick={() => updateChannel.mutate()}
              disabled={updateChannel.isPending}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {updateChannel.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
