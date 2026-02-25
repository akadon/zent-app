import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";
import type { Guild, Channel } from "@yxc/types";
import { ChannelType } from "@yxc/types";
import { Settings, ChevronRight, Hash, Volume2, Radio } from "lucide-react";

interface ChannelPanelProps {
  guild: Guild;
  selectedChannelId: string | null;
  onSelectChannel: (id: string) => void;
}

export function ChannelPanel({ guild, selectedChannelId, onSelectChannel }: ChannelPanelProps) {
  const openModal = useUIStore((s) => s.openModal);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const { data: channels = [] } = useQuery({
    queryKey: ["channels", guild.id],
    queryFn: () => api.get<Channel[]>(`/guilds/${guild.id}/channels`),
  });

  const categories = channels.filter(c => c.type === ChannelType.GUILD_CATEGORY);
  const uncategorized = channels.filter(c => c.type !== ChannelType.GUILD_CATEGORY && !c.parentId);

  const toggleCategory = (id: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Guild Header */}
      <button
        onClick={() => openModal("guildSettings", { guildId: guild.id, guildName: guild.name })}
        className={cn(
          "flex items-center justify-between px-4 py-3",
          "border-b border-surface-border/30",
          "transition-colors duration-200",
          "hover:bg-background-hover/30"
        )}
      >
        <span className="font-bold text-header-primary truncate">{guild.name}</span>
        <Settings size={14} className="text-text-muted" />
      </button>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {uncategorized.sort((a, b) => a.position - b.position).map(channel => (
          <ChannelButton
            key={channel.id}
            channel={channel}
            isSelected={channel.id === selectedChannelId}
            onClick={() => onSelectChannel(channel.id)}
          />
        ))}

        {categories.sort((a, b) => a.position - b.position).map(category => {
          const isCollapsed = collapsedCategories.has(category.id);
          const categoryChannels = channels.filter(c => c.parentId === category.id).sort((a, b) => a.position - b.position);

          return (
            <div key={category.id} className="mt-4">
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "flex items-center gap-1 px-1 py-1 w-full",
                  "text-[11px] font-bold uppercase tracking-wider text-text-muted",
                  "hover:text-text-normal"
                )}
              >
                <ChevronRight size={10} className={cn("transition-transform duration-200", !isCollapsed && "rotate-90")} />
                {category.name}
              </button>

              {!isCollapsed && categoryChannels.map(channel => (
                <ChannelButton
                  key={channel.id}
                  channel={channel}
                  isSelected={channel.id === selectedChannelId}
                  onClick={() => onSelectChannel(channel.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelButton({
  channel,
  isSelected,
  onClick,
}: {
  channel: Channel;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isVoice = channel.type === ChannelType.GUILD_VOICE || channel.type === ChannelType.GUILD_STAGE_VOICE;
  const Icon = channel.type === ChannelType.GUILD_STAGE_VOICE ? Radio : isVoice ? Volume2 : Hash;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg w-full my-0.5",
        "text-sm transition-all duration-200",
        isSelected
          ? "bg-brand/12 text-brand-light"
          : "text-channel-default hover:bg-background-hover/40 hover:text-channel-hover"
      )}
    >
      <Icon size={16} className={isSelected ? "text-brand-light" : "text-text-muted"} />
      <span className="truncate">{channel.name}</span>
    </button>
  );
}
