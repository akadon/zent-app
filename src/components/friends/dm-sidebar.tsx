"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { usePresenceStore } from "@/stores/presence";
import { Users, Plus } from "lucide-react";

interface DMChannel {
  id: string;
  recipients: Array<{
    id: string;
    username: string;
    displayName?: string | null;
    avatar?: string | null;
  }>;
}

interface DMSidebarProps {
  selectedChannelId: string | null;
  onSelectChannel: (id: string | null) => void;
  onShowFriends: () => void;
  showingFriends: boolean;
}

export function DMSidebar({
  selectedChannelId,
  onSelectChannel,
  onShowFriends,
  showingFriends,
}: DMSidebarProps) {
  const { user } = useAuthStore();
  const getPresence = usePresenceStore((s) => s.getPresence);

  const { data: dmChannels = [] } = useQuery({
    queryKey: ["dmChannels"],
    queryFn: () => api.get<DMChannel[]>("/users/@me/channels"),
  });

  return (
    <div className="flex w-60 flex-col bg-background-secondary">
      {/* Search (placeholder) */}
      <div className="p-2">
        <button className="w-full rounded bg-background-tertiary px-2 py-1.5 text-left text-sm text-text-muted">
          Find or start a conversation
        </button>
      </div>

      {/* Friends button */}
      <div className="px-2">
        <button
          onClick={onShowFriends}
          className={cn(
            "flex w-full items-center gap-3 rounded px-2 py-2 text-sm",
            showingFriends
              ? "bg-interactive-muted/30 text-header-primary"
              : "text-interactive-normal hover:bg-interactive-muted/20 hover:text-interactive-hover"
          )}
        >
          <Users size={20} />
          Friends
        </button>
      </div>

      {/* DM header */}
      <div className="mt-4 flex items-center justify-between px-4">
        <span className="text-xs font-semibold uppercase text-channel-default">
          Direct Messages
        </span>
        <button className="text-interactive-normal hover:text-interactive-hover">
          <Plus size={16} />
        </button>
      </div>

      {/* DM list */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 scrollbar-thin">
        {dmChannels.map((dm) => {
          const recipient = dm.recipients.find((r) => r.id !== user?.id) ?? dm.recipients[0];
          if (!recipient) return null;

          const presence = getPresence(recipient.id);
          const statusColors: Record<string, string> = {
            online: "bg-status-online",
            idle: "bg-status-idle",
            dnd: "bg-status-dnd",
            offline: "bg-status-offline",
          };

          return (
            <button
              key={dm.id}
              onClick={() => onSelectChannel(dm.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded px-2 py-1.5",
                dm.id === selectedChannelId
                  ? "bg-interactive-muted/30 text-header-primary"
                  : "text-interactive-normal hover:bg-interactive-muted/20 hover:text-interactive-hover"
              )}
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">
                  {(recipient.displayName ?? recipient.username)?.[0]?.toUpperCase()}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2.5px] border-background-secondary ${
                    statusColors[presence.status] ?? "bg-status-offline"
                  }`}
                />
              </div>
              <span className="truncate text-sm">
                {recipient.displayName ?? recipient.username}
              </span>
            </button>
          );
        })}
      </div>

      {/* User panel (same as channel sidebar) */}
      <div className="flex items-center gap-2 bg-background-floating/60 px-2 py-1">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-background-floating/60 bg-status-online" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-header-primary">
            {user?.displayName ?? user?.username}
          </p>
          <p className="truncate text-xs text-text-muted">Online</p>
        </div>
      </div>
    </div>
  );
}
