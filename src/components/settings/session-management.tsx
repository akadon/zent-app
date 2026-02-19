"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Globe, LogOut, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  ip: string;
  lastActive: string;
  location: string | null;
  isCurrent: boolean;
}

function DeviceIcon({ type }: { type: Session["deviceType"] }) {
  switch (type) {
    case "mobile":
      return <Smartphone className="h-5 w-5" />;
    case "desktop":
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

export function SessionManagement() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get<{ sessions: Session[] }>("/users/@me/sessions"),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/users/@me/sessions/${encodeURIComponent(sessionId)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session revoked");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to revoke session");
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => api.delete("/users/@me/sessions"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("All other sessions revoked");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to revoke sessions");
    },
  });

  const sessions = sessionsQuery.data?.sessions ?? [];
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Active Sessions</h2>
      </div>

      {sessionsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-md border border-zinc-700 bg-zinc-800 p-4">
              <div className="h-4 w-40 rounded bg-zinc-700" />
              <div className="mt-2 h-3 w-60 rounded bg-zinc-700" />
            </div>
          ))}
        </div>
      )}

      {sessionsQuery.isError && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Failed to load sessions
        </div>
      )}

      {sessionsQuery.isSuccess && sessions.length === 0 && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
          Session tracking is being implemented. No session data available yet.
        </div>
      )}

      {sessionsQuery.isSuccess && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-4 rounded-md border p-4",
                session.isCurrent
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-zinc-700 bg-zinc-800"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  session.isCurrent
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-700 text-zinc-400"
                )}
              >
                <DeviceIcon type={session.deviceType} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100 truncate">{session.device}</p>
                  {session.isCurrent && (
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {session.ip}
                  </span>
                  <span>
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </span>
                  {session.location && <span>{session.location}</span>}
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => revokeSessionMutation.mutate(session.id)}
                  disabled={revokeSessionMutation.isPending}
                  className="shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Revoke session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => revokeAllMutation.mutate()}
        disabled={otherSessions.length === 0 || revokeAllMutation.isPending}
        className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <LogOut className="h-4 w-4" />
        {revokeAllMutation.isPending ? "Revoking..." : "Log Out All Other Sessions"}
      </button>
    </div>
  );
}
