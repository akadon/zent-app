"use client";

import { useUIStore } from "@/stores/ui";
import { FriendsPage } from "@/components/friends/friends-page";
import { MessageArea } from "@/components/message/message-area";
import { Sparkles } from "lucide-react";

export function DesktopMain() {
  const {
    selectedGuildId, selectedChannelId,
    showFriends, setShowFriends, dmChannelId, setDmChannelId, selectGuild,
  } = useUIStore();

  const isHome = selectedGuildId === null;

  if (isHome) {
    if (showFriends || !dmChannelId) {
      return (
        <FriendsPage onOpenDM={(id) => {
          setDmChannelId(id);
          setShowFriends(false);
          selectGuild(null);
        }} />
      );
    }
    return <MessageArea channelId={dmChannelId} guildId={null} />;
  }

  if (selectedChannelId) {
    return <MessageArea channelId={selectedChannelId} guildId={selectedGuildId} />;
  }

  return <EmptyState />;
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-brand/20 to-accent-purple/20 blur-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={40} className="text-brand-light" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-header-primary mb-1">No channel selected</h3>
        <p className="text-text-muted text-sm">Pick a channel from the sidebar to start chatting</p>
      </div>
    </div>
  );
}
