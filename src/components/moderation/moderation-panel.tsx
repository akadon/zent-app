import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Check, X, AlertTriangle, ChevronUp } from "lucide-react";
import type { ModerationQueueItem } from "@yxc/types";

interface ModerationPanelProps {
  guildId: string;
}

export function ModerationPanel({ guildId }: ModerationPanelProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["moderation-queue", guildId, statusFilter],
    queryFn: () =>
      api.get<ModerationQueueItem[]>(
        `/guilds/${guildId}/moderation/queue${statusFilter ? `?status=${statusFilter}` : ""}`
      ),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ itemId, action, note }: { itemId: string; action: string; note?: string }) =>
      api.post(`/guilds/${guildId}/moderation/queue/${itemId}/resolve`, { action, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue", guildId] });
    },
    onError: () => {
      toast.error("Failed to resolve moderation item");
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-background-tertiary px-4 py-3">
        <Shield size={20} className="text-brand" />
        <h2 className="font-semibold text-header-primary">Moderation Queue</h2>
        <span className="ml-auto rounded bg-brand/20 px-2 py-0.5 text-xs text-brand">
          {items.length} items
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-1 border-b border-background-tertiary px-4 py-2">
        {["pending", "approved", "rejected", "escalated", ""].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              statusFilter === status
                ? "bg-brand text-white"
                : "text-text-muted hover:bg-background-primary hover:text-text-normal"
            }`}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Shield size={40} className="mb-2 opacity-30" />
            <p className="text-sm">No items in queue</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border-b border-background-tertiary px-4 py-3"
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 rounded p-1 ${
                  item.type === "automod" ? "bg-yellow-500/20 text-yellow-500" :
                  item.type === "message" ? "bg-red-500/20 text-red-500" :
                  "bg-blue-500/20 text-blue-500"
                }`}>
                  <AlertTriangle size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase text-text-muted">{item.type}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      item.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      item.status === "approved" ? "bg-green-500/20 text-green-400" :
                      item.status === "rejected" ? "bg-red-500/20 text-red-400" :
                      "bg-purple-500/20 text-purple-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-normal">{item.reason}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Target: {item.targetId} · Reported: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {item.status === "pending" && (
                <div className="mt-2 flex gap-1.5 pl-7">
                  <button
                    onClick={() => resolveMutation.mutate({ itemId: item.id, action: "approved" })}
                    className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => resolveMutation.mutate({ itemId: item.id, action: "rejected" })}
                    className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                  >
                    <X size={12} /> Reject
                  </button>
                  <button
                    onClick={() => resolveMutation.mutate({ itemId: item.id, action: "escalated" })}
                    className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700"
                  >
                    <ChevronUp size={12} /> Escalate
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
