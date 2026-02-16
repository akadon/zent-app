"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import { X, Hash, Volume2 } from "lucide-react";

export function CreateChannelModal() {
  const { modalData, closeModal } = useUIStore();
  const guildId = modalData.guildId as string | undefined;
  const [name, setName] = useState("");
  const [type, setType] = useState(0); // 0 = text, 2 = voice
  const queryClient = useQueryClient();

  const createChannel = useMutation({
    mutationFn: (data: { name: string; type: number }) =>
      api.post(`/guilds/${guildId}/channels`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", guildId] });
      closeModal();
      toast.success("Channel created");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to create channel");
    },
  });

  const formattedName = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-[460px] rounded-md bg-background-primary p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-header-primary">
            Create Channel
          </h2>
          <button
            onClick={closeModal}
            className="text-interactive-normal hover:text-interactive-hover"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (formattedName) {
              createChannel.mutate({ name: formattedName, type });
            }
          }}
        >
          {/* Channel type */}
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
            Channel Type
          </label>
          <div className="mb-4 space-y-2">
            <button
              type="button"
              onClick={() => setType(0)}
              className={`flex w-full items-center gap-3 rounded-[3px] p-3 ${
                type === 0
                  ? "bg-interactive-muted/30"
                  : "bg-background-secondary hover:bg-interactive-muted/20"
              }`}
            >
              <Hash size={24} className="text-interactive-normal" />
              <div className="text-left">
                <p className="text-sm font-medium text-header-primary">Text</p>
                <p className="text-xs text-text-muted">
                  Send messages, images, GIFs, and more
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType(2)}
              className={`flex w-full items-center gap-3 rounded-[3px] p-3 ${
                type === 2
                  ? "bg-interactive-muted/30"
                  : "bg-background-secondary hover:bg-interactive-muted/20"
              }`}
            >
              <Volume2 size={24} className="text-interactive-normal" />
              <div className="text-left">
                <p className="text-sm font-medium text-header-primary">
                  Voice
                </p>
                <p className="text-xs text-text-muted">
                  Hang out together with voice, video, and screen sharing
                </p>
              </div>
            </button>
          </div>

          {/* Channel name */}
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
            Channel Name
          </label>
          <div className="mb-4 flex items-center rounded-[3px] bg-background-tertiary px-3 py-2.5">
            {type === 0 ? (
              <Hash size={18} className="mr-1 text-channel-default" />
            ) : (
              <Volume2 size={18} className="mr-1 text-channel-default" />
            )}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              autoFocus
              className="flex-1 bg-transparent text-sm text-text-normal outline-none placeholder-text-muted"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-[3px] px-4 py-2 text-sm text-text-normal hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formattedName || createChannel.isPending}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {createChannel.isPending ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
