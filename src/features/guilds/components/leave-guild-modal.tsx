"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { toast } from "sonner";

export function LeaveGuildModal() {
  const { modalData, closeModal } = useUIStore();
  const guildId = modalData.guildId as string | undefined;
  const guildName = modalData.guildName as string | undefined;
  const queryClient = useQueryClient();
  const removeGuild = useGuildStore((s) => s.removeGuild);

  const leaveGuild = useMutation({
    mutationFn: () => api.delete(`/users/@me/guilds/${guildId}`),
    onSuccess: () => {
      if (guildId) removeGuild(guildId);
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Left server");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to leave server"),
  });

  if (!guildId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-bold text-header-primary">Leave Server</h2>
        <p className="mb-6 text-sm text-text-muted">
          Are you sure you want to leave <span className="font-semibold text-text-normal">{guildName ?? "this server"}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-normal">Cancel</button>
          <button
            onClick={() => leaveGuild.mutate()}
            disabled={leaveGuild.isPending}
            className="rounded-[3px] bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover disabled:opacity-50"
          >
            {leaveGuild.isPending ? "Leaving..." : "Leave Server"}
          </button>
        </div>
      </div>
    </div>
  );
}
