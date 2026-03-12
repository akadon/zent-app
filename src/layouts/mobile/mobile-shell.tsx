import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";

import { MobileBottomTabs } from "./mobile-bottom-tabs";
import { MobileHeader } from "./mobile-header";
import { MobileServerView } from "./mobile-server-view";
import { MobileChannelList } from "./mobile-channel-list";
import { MobileChatView } from "./mobile-chat-view";

import { FriendsPage } from "@/components/friends/friends-page";
import { MessageArea } from "@/components/message/message-area";
import { SearchPanel } from "@/components/search/search-panel";
import { MobileProfileSettings } from "./mobile-profile-settings";

// Modals
import { CreateGuildModal } from "@/components/guild/create-guild-modal";
import { CreateChannelModal } from "@/components/channel/create-channel-modal";
import { InviteModal } from "@/components/guild/invite-modal";
import { UserSettings } from "@/components/settings/user-settings";
import { GuildSettings } from "@/components/settings/guild-settings";
import { CreateThreadModal } from "@/features/channels/components/create-thread-modal";
import { ChannelSettingsModal } from "@/features/channels/components/channel-settings-modal";
import { LeaveGuildModal } from "@/features/guilds/components/leave-guild-modal";
import { DiscoverServersModal } from "@/features/guilds/components/discover-modal";

export function MobileShell() {
  const { token } = useAuthStore();
  const {
    activeModal, mobileTab, selectedGuildId, selectedChannelId,
    selectGuild, selectChannel, showFriends, setShowFriends,
    dmChannelId, setDmChannelId,
  } = useUIStore();
  const gatewayGuilds = useGuildStore((s) => s.guilds);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [token]);

  const { data: restGuilds = [] } = useQuery({
    queryKey: ["guilds"],
    queryFn: () => api.get<Guild[]>("/users/@me/guilds"),
    enabled: !!token,
  });

  const guilds = gatewayGuilds.length > 0 ? gatewayGuilds : restGuilds;
  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) ?? null;

  // If a channel is selected, show chat view
  const showChat = selectedChannelId || dmChannelId;

  return (
    <div className={cn(
      "flex h-screen flex-col overflow-hidden",
      "bg-background-primary",
      "transition-opacity duration-500",
      isLoaded ? "opacity-100" : "opacity-0"
    )}>
      {showChat ? (
        <MobileChatView
          channelId={(selectedChannelId || dmChannelId)!}
          guildId={selectedGuildId}
          guildName={selectedGuild?.name}
          onBack={() => {
            if (selectedChannelId) selectChannel(null);
            else setDmChannelId(null);
          }}
        />
      ) : (
        <>
          <MobileHeader selectedGuild={selectedGuild} />

          <main className="flex-1 overflow-hidden">
            {mobileTab === "home" && (
              <FriendsPage onOpenDM={(id) => {
                setDmChannelId(id);
                setShowFriends(false);
                selectGuild(null);
              }} />
            )}

            {mobileTab === "servers" && !selectedGuildId && (
              <MobileServerView guilds={guilds} />
            )}

            {mobileTab === "servers" && selectedGuildId && selectedGuild && (
              <MobileChannelList guild={selectedGuild} />
            )}

            {mobileTab === "dms" && (
              <FriendsPage onOpenDM={(id) => {
                setDmChannelId(id);
                setShowFriends(false);
                selectGuild(null);
              }} />
            )}

            {mobileTab === "profile" && (
              <MobileProfileSettings />
            )}

            {mobileTab === "search" && (
              selectedGuildId ? (
                <SearchPanel
                  guildId={selectedGuildId}
                  onClose={() => useUIStore.getState().setMobileTab("home")}
                  onNavigate={(channelId) => {
                    selectChannel(channelId);
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm px-6 text-center gap-2">
                  <p className="text-header-secondary font-medium">Search Messages</p>
                  <p>Select a server first to search its messages.</p>
                </div>
              )
            )}
          </main>

          <MobileBottomTabs />
        </>
      )}

      {/* Modals */}
      {activeModal === "createGuild" && <CreateGuildModal />}
      {activeModal === "createChannel" && <CreateChannelModal />}
      {activeModal === "createThread" && <CreateThreadModal />}
      {activeModal === "channelSettings" && <ChannelSettingsModal />}
      {activeModal === "invitePeople" && <InviteModal />}
      {activeModal === "leaveGuild" && <LeaveGuildModal />}
      {activeModal === "userSettings" && <UserSettings />}
      {activeModal === "guildSettings" && <GuildSettings />}
      {activeModal === "discoverServers" && <DiscoverServersModal />}
    </div>
  );
}
