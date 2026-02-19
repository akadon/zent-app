"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGuildStore } from "@/stores/guild";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { Hash, Volume2, Search, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelType } from "@yxc/types";

interface QuickSwitcherProps {
  open: boolean;
  onClose: () => void;
}

interface DMChannel {
  id: string;
  recipients: Array<{
    id: string;
    username: string;
    displayName?: string | null;
  }>;
}

interface SwitcherItem {
  id: string;
  name: string;
  type: "channel" | "guild" | "dm";
  guildId?: string | null;
  guildName?: string;
  channelType?: number;
}

export function QuickSwitcher({ open, onClose }: QuickSwitcherProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { guilds, channels, selectGuild, selectChannel } = useGuildStore();
  const currentUser = useAuthStore((s) => s.user);

  const { data: dmChannels = [] } = useQuery({
    queryKey: ["dmChannels"],
    queryFn: () => api.get<DMChannel[]>("/users/@me/channels"),
    enabled: open,
  });

  // Build searchable items
  const items = useMemo(() => {
    const result: SwitcherItem[] = [];

    for (const guild of guilds) {
      result.push({
        id: guild.id,
        name: guild.name,
        type: "guild",
      });

      const guildChannels = channels.get(guild.id) ?? [];
      for (const ch of guildChannels) {
        if (ch.type === ChannelType.GUILD_CATEGORY) continue;
        result.push({
          id: ch.id,
          name: ch.name ?? "unnamed",
          type: "channel",
          guildId: guild.id,
          guildName: guild.name,
          channelType: ch.type,
        });
      }
    }

    for (const dm of dmChannels) {
      const recipient = dm.recipients.find((r) => r.id !== currentUser?.id) ?? dm.recipients[0];
      if (!recipient) continue;
      result.push({
        id: dm.id,
        name: recipient.displayName ?? recipient.username,
        type: "dm",
      });
    }

    return result;
  }, [guilds, channels, dmChannels, currentUser]);

  const filtered = useMemo(() => {
    if (!query) return items.slice(0, 10);
    const lower = query.toLowerCase();
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          (item.guildName?.toLowerCase().includes(lower) ?? false)
      )
      .slice(0, 10);
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (item: SwitcherItem) => {
    if (item.type === "guild") {
      selectGuild(item.id);
    } else if (item.type === "channel" && item.guildId) {
      selectGuild(item.guildId);
      selectChannel(item.id);
    } else if (item.type === "dm") {
      // Navigate to home view — DM selection is handled by main layout
      selectGuild(null);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg border border-background-tertiary bg-background-secondary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-background-tertiary px-4 py-3">
          <Search size={18} className="text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Where would you like to go?"
            className="flex-1 bg-transparent text-sm text-text-normal placeholder-text-muted outline-none"
          />
          <kbd className="rounded bg-background-tertiary px-1.5 py-0.5 text-xs text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No results found
            </div>
          )}
          {filtered.map((item, i) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelect(item)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left text-sm",
                i === selectedIndex
                  ? "bg-brand/10 text-text-normal"
                  : "text-text-muted hover:bg-background-primary/50 hover:text-text-normal"
              )}
            >
              {item.type === "guild" && <Users size={16} />}
              {item.type === "channel" &&
                item.channelType === ChannelType.GUILD_VOICE ? (
                  <Volume2 size={16} />
                ) : item.type === "channel" ? (
                  <Hash size={16} />
                ) : (
                  <MessageSquare size={16} />
                )}
              <div className="min-w-0 flex-1">
                <span className="font-medium">{item.name}</span>
                {item.guildName && (
                  <span className="ml-2 text-xs text-text-muted">{item.guildName}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-background-tertiary px-4 py-2">
          <span className="text-xs text-text-muted">
            <kbd className="rounded bg-background-tertiary px-1 text-[10px]">↑↓</kbd> navigate
            {" "}
            <kbd className="rounded bg-background-tertiary px-1 text-[10px]">Enter</kbd> select
            {" "}
            <kbd className="rounded bg-background-tertiary px-1 text-[10px]">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
