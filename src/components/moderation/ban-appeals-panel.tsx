"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Gavel, Check, X, AlertTriangle } from "lucide-react";
import type { BanAppeal } from "@yxc/types";

interface BanAppealsPanelProps {
  guildId: string;
}

export function BanAppealsPanel({ guildId }: BanAppealsPanelProps) {
  const queryClient = useQueryClient();

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ["ban-appeals", guildId],
    queryFn: () => api.get<BanAppeal[]>(`/guilds/${guildId}/ban-appeals`),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ appealId, status, reason }: { appealId: string; status: string; reason?: string }) =>
      api.post(`/guilds/${guildId}/ban-appeals/${appealId}/resolve`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ban-appeals", guildId] });
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gavel size={18} className="text-brand" />
        <h3 className="font-semibold text-header-primary">Ban Appeals</h3>
        <span className="ml-auto rounded bg-brand/20 px-2 py-0.5 text-xs text-brand">
          {appeals.filter((a) => a.status === "pending").length} pending
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : appeals.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-text-muted">
          <Gavel size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No ban appeals</p>
        </div>
      ) : (
        appeals.map((appeal) => (
          <div key={appeal.id} className="rounded-lg border border-background-tertiary bg-background-secondary p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-500" />
              <span className="text-xs font-medium text-text-muted">User ID: {appeal.userId}</span>
              <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${
                appeal.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                appeal.status === "accepted" ? "bg-green-500/20 text-green-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {appeal.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-text-normal">{appeal.reason}</p>
            <p className="mt-1 text-xs text-text-muted">
              Submitted: {new Date(appeal.createdAt).toLocaleDateString()}
            </p>

            {appeal.moderatorReason && (
              <p className="mt-2 rounded bg-background-primary p-2 text-xs text-text-muted">
                Mod response: {appeal.moderatorReason}
              </p>
            )}

            {appeal.status === "pending" && (
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => resolveMutation.mutate({ appealId: appeal.id, status: "accepted" })}
                  className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                >
                  <Check size={12} /> Accept (Unban)
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ appealId: appeal.id, status: "rejected", reason: "Appeal denied" })}
                  className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                >
                  <X size={12} /> Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
