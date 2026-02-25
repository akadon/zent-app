import { useUIStore } from "@/stores/ui";
import { ChannelPanel } from "@/features/channels/components/channel-panel";
import { HomeSidebar } from "@/features/friends/components/home-sidebar";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";

interface DesktopSidebarProps {
  guilds: Guild[];
  selectedGuild: Guild | null;
  width: number;
}

export function DesktopSidebar({ guilds, selectedGuild, width }: DesktopSidebarProps) {
  const {
    selectedGuildId, selectedChannelId, selectChannel,
    showFriends, setShowFriends, dmChannelId, setDmChannelId, selectGuild,
  } = useUIStore();

  const isHome = selectedGuildId === null;

  return (
    <div
      className={cn(
        "h-full",
        "bg-background-secondary/50 backdrop-blur-sm",
        "border-r border-surface-border/30",
        "shadow-e-2",
        "animate-slide-in-left"
      )}
      style={{ width, animationDelay: "50ms" }}
    >
      {isHome ? (
        <HomeSidebar
          onSelectFriends={() => { setDmChannelId(null); setShowFriends(true); }}
          onSelectDM={(id) => { setDmChannelId(id); setShowFriends(false); }}
          selectedDmId={dmChannelId}
          showingFriends={showFriends}
        />
      ) : selectedGuild ? (
        <ChannelPanel
          guild={selectedGuild}
          selectedChannelId={selectedChannelId}
          onSelectChannel={selectChannel}
        />
      ) : null}
    </div>
  );
}
