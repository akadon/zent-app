"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { useResizablePanel } from "@/shared/hooks/use-resizable-panel";
import { useFocusMode } from "@/shared/hooks/use-focus-mode";
import { panelWidths } from "@/shared/styles/tokens";
import { ResizeHandle } from "@/shared/components/resize-handle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";

import { DesktopHeader } from "./desktop-header";
import { DesktopDock } from "./desktop-dock";
import { DesktopSidebar } from "./desktop-sidebar";
import { DesktopMain } from "./desktop-main";
import { DesktopMemberPanel } from "./desktop-member-panel";

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

export function DesktopShell() {
  const { token } = useAuthStore();
  const {
    activeModal, selectedGuildId, selectedChannelId,
    selectGuild, sidebarOpen, memberListOpen,
  } = useUIStore();
  const gatewayGuilds = useGuildStore((s) => s.guilds);
  const [isLoaded, setIsLoaded] = useState(false);

  const { focusMode } = useFocusMode();

  const channelPanel = useResizablePanel({
    storageKey: "channel-panel",
    defaultWidth: panelWidths.channelDefault,
    minWidth: panelWidths.channelMin,
    maxWidth: panelWidths.channelMax,
    side: "right",
  });

  const memberPanel = useResizablePanel({
    storageKey: "member-panel",
    defaultWidth: panelWidths.memberDefault,
    minWidth: panelWidths.memberMin,
    maxWidth: panelWidths.memberMax,
    side: "left",
  });

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

  useEffect(() => {
    if (guilds.length > 0 && !selectedGuildId) {
      selectGuild(guilds[0]!.id);
    }
  }, [guilds, selectedGuildId, selectGuild]);

  const showChannelPanel = sidebarOpen && !focusMode;
  const showMemberPanel = memberListOpen && !focusMode && !!selectedGuildId;
  const showDock = !focusMode;

  return (
    <div
      className={cn(
        "flex h-screen flex-col overflow-hidden",
        "bg-background-primary",
        "transition-opacity duration-500",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      <DesktopHeader guilds={guilds} selectedGuild={selectedGuild} />

      <div className="flex flex-1 overflow-hidden">
        {/* Dock */}
        {showDock && (
          <DesktopDock guilds={guilds} />
        )}

        {/* Channel Panel + resize handle */}
        {showChannelPanel && (
          <>
            <div
              className="overflow-hidden panel-spring"
              style={{ width: channelPanel.width }}
            >
              <DesktopSidebar
                guilds={guilds}
                selectedGuild={selectedGuild}
                width={channelPanel.width}
              />
            </div>
            <ResizeHandle {...channelPanel.handleProps} />
          </>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 flex flex-col min-w-0 bg-background-primary",
          "parallax-shift",
          showChannelPanel && "parallax-shift-right"
        )}>
          <ErrorBoundary>
            <DesktopMain />
          </ErrorBoundary>
        </main>

        {/* Member Panel + resize handle */}
        {showMemberPanel && (
          <>
            <ResizeHandle {...memberPanel.handleProps} />
            <div
              className="overflow-hidden panel-spring"
              style={{ width: memberPanel.width }}
            >
              <DesktopMemberPanel guildId={selectedGuildId!} width={memberPanel.width} />
            </div>
          </>
        )}
      </div>

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
