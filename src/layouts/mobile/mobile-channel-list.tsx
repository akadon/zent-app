import { useUIStore } from "@/stores/ui";
import { ChannelPanel } from "@/features/channels/components/channel-panel";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";
import { ChevronLeft } from "lucide-react";

interface MobileChannelListProps {
  guild: Guild;
}

export function MobileChannelList({ guild }: MobileChannelListProps) {
  const { selectedChannelId, selectChannel, selectGuild } = useUIStore();

  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2",
        "border-b border-surface-border/30"
      )}>
        <button
          onClick={() => selectGuild(null)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-hover"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-header-primary text-sm truncate">{guild.name}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChannelPanel
          guild={guild}
          selectedChannelId={selectedChannelId}
          onSelectChannel={selectChannel}
        />
      </div>
    </div>
  );
}
