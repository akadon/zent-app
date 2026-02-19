"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";

export function CreateThreadModal() {
  const { modalData, closeModal } = useUIStore();
  const channelId = modalData.channelId as string | undefined;
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const createThread = useMutation({
    mutationFn: () => api.post(`/channels/${channelId}/threads`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Thread created");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to create thread"),
  });

  if (!channelId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-header-primary">Create Thread</h2>
        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">Thread Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New thread"
            maxLength={100}
            className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-normal">Cancel</button>
          <button
            onClick={() => createThread.mutate()}
            disabled={!name.trim() || createThread.isPending}
            className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {createThread.isPending ? "Creating..." : "Create Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}
