"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePresenceStore } from "@/stores/presence";
import { cn } from "@/lib/utils";
import { Users, Plus, MessageSquare } from "lucide-react";

interface DMChannel {
  id: string;
  type: number;
  recipients: Array<{
    id: string;
    username: string;
    displayName?: string | null;
    avatar?: string | null;
  }>;
  lastMessageId: string | null;
}

interface HomeSidebarProps {
  onSelectFriends: () => void;
  onSelectDM: (id: string) => void;
  selectedDmId: string | null;
  showingFriends: boolean;
}

export function HomeSidebar({ onSelectFriends, onSelectDM, selectedDmId, showingFriends }: HomeSidebarProps) {
  const { data: dmChannels = [] } = useQuery({
    queryKey: ["dmChannels"],
    queryFn: () => api.get<DMChannel[]>("/users/@me/channels"),
  });

  const getPresence = usePresenceStore((s) => s.getPresence);

  return (
    <div className="flex flex-col h-full p-3">
      <button
        onClick={onSelectFriends}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2",
          "transition-all duration-200",
          showingFriends
            ? "bg-brand/12 text-brand-light"
            : "text-text-muted hover:bg-background-hover/50 hover:text-text-normal"
        )}
      >
        <Users size={18} />
        <span className="font-medium">Friends</span>
      </button>

      <div className="flex items-center justify-between px-2 py-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        <span>Direct Messages</span>
        <button className="rounded p-0.5 hover:bg-background-hover hover:text-text-normal">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {dmChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted">
            <MessageSquare size={24} className="opacity-30 mb-2" />
            <p className="text-xs">No recent DMs</p>
          </div>
        ) : (
          dmChannels.map((dm) => {
            const recipient = dm.recipients?.[0];
            if (!recipient) return null;
            const presence = getPresence(recipient.id);
            const isSelected = !showingFriends && dm.id === selectedDmId;

            return (
              <button
                key={dm.id}
                onClick={() => onSelectDM(dm.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg",
                  "transition-all duration-200",
                  isSelected
                    ? "bg-brand/12 text-brand-light"
                    : "text-text-muted hover:bg-background-hover/50 hover:text-text-normal"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "avatar avatar-sm",
                    "bg-gradient-to-br from-brand to-brand-dark"
                  )}>
                    {(recipient.displayName ?? recipient.username)?.[0]?.toUpperCase()}
                  </div>
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background-secondary",
                      presence.status === "online" ? "bg-status-online" :
                      presence.status === "idle" ? "bg-status-idle" :
                      presence.status === "dnd" ? "bg-status-dnd" :
                      "bg-status-offline"
                    )}
                  />
                </div>
                <span className="text-sm truncate">
                  {recipient.displayName ?? recipient.username}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
