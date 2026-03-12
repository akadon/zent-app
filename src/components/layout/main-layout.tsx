import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils";
import { ClaimAccountModal } from "@/components/auth/claim-account-modal";
import type { Guild } from "@yxc/types";

// Feature components
import { ZentLogo } from "@/shared/components/zent-logo";
import { DockGuildIcon } from "@/features/guilds/components/guild-dock-icon";
import { ChannelBreadcrumb } from "@/features/channels/components/channel-breadcrumb";
import { ChannelPanel } from "@/features/channels/components/channel-panel";
import { HomeSidebar } from "@/features/friends/components/home-sidebar";
import { MemberPanel } from "@/features/members/components/member-panel";
import { FriendsPage } from "@/components/friends/friends-page";
import { MessageArea } from "@/components/message/message-area";

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

import {
  Home, Search, Settings, Users, Plus, Compass,
  ChevronRight, PanelLeftClose, PanelLeft,
  Bell, Command, Sparkles,
} from "lucide-react";

export function MainLayout() {
  const { user, token, isGuest } = useAuthStore();
  const {
    activeModal, memberListOpen, toggleMemberList, openModal,
    selectedGuildId, selectedChannelId, selectGuild, selectChannel,
    showFriends, setShowFriends, dmChannelId, setDmChannelId,
    sidebarOpen, toggleSidebar,
  } = useUIStore();
  const gatewayGuilds = useGuildStore((s) => s.guilds);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Load animation
  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [token]);

  // Fetch guilds via REST (fallback before gateway READY)
  const { data: restGuilds = [] } = useQuery({
    queryKey: ["guilds"],
    queryFn: () => api.get<Guild[]>("/users/@me/guilds"),
    enabled: !!token,
  });

  const guilds = gatewayGuilds.length > 0 ? gatewayGuilds : restGuilds;
  const selectedGuild = guilds.find((g) => g.id === selectedGuildId) ?? null;
  const isHome = selectedGuildId === null;

  // Auto-select first guild
  useEffect(() => {
    if (guilds.length > 0 && !selectedGuildId) {
      selectGuild(guilds[0]!.id);
    }
  }, [guilds, selectedGuildId, selectGuild]);

  // Quick switcher shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openModal("quickSwitcher");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModal]);

  return (
    <div
      data-testid="main-layout"
      className={cn(
        "flex h-screen flex-col overflow-hidden",
        "bg-background-primary",
        "transition-opacity duration-500",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      {/* ── GUEST BANNER ── */}
      {user?.isGuest && (
        <div data-testid="guest-banner" className="flex items-center justify-between bg-amber-600/20 border-b border-amber-600/30 px-4 py-2 text-sm text-amber-200">
          <span>You're browsing as a guest. Claim your account to keep it.</span>
          <button
            data-testid="guest-claim-button"
            onClick={() => setShowClaimModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Claim Account
          </button>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className={cn(
        "flex h-14 items-center justify-between px-4",
        "bg-background-secondary/80 backdrop-blur-xl",
        "border-b border-surface-border/50",
        "shadow-e-2 z-e-2",
        "animate-fade-in-down"
      )}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-brand to-brand-dark",
              "shadow-glow-sm"
            )}>
              <ZentLogo className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-header-primary hidden sm:block">Zent</span>
          </div>

          <nav className="flex items-center gap-1 text-sm">
            <button
              data-testid="home-button"
              onClick={() => { selectGuild(null); setShowFriends(true); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                "text-text-muted transition-all duration-200",
                "hover:bg-background-hover/50 hover:text-text-normal",
                isHome && "text-brand-light"
              )}
            >
              <Home size={14} />
              <span className="hidden md:inline">Home</span>
            </button>

            {selectedGuild && (
              <>
                <ChevronRight size={14} className="text-text-muted/50" />
                <button className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                  "text-text-normal transition-all duration-200",
                  "hover:bg-background-hover/50"
                )}>
                  {selectedGuild.name}
                </button>
              </>
            )}

            {selectedChannelId && selectedGuild && (
              <ChannelBreadcrumb guildId={selectedGuild.id} channelId={selectedChannelId} />
            )}
          </nav>
        </div>

        <button
          data-testid="quick-search-button"
          onClick={() => openModal("quickSwitcher")}
          className={cn(
            "hidden lg:flex items-center gap-3 px-4 py-2 rounded-full",
            "bg-background-tertiary/80 border border-surface-border/50",
            "text-text-muted text-sm",
            "transition-all duration-200",
            "hover:bg-background-hover hover:border-brand/30 hover:text-text-normal",
            "hover:shadow-glow-sm"
          )}
        >
          <Search size={14} />
          <span>Quick search...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background-hover text-xs font-mono">
            <Command size={10} />K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <HeaderButton icon={<Bell size={18} />} tooltip="Notifications" testId="notifications-button" />
          <HeaderButton
            icon={<Users size={18} />}
            tooltip="Toggle Members"
            onClick={toggleMemberList}
            active={memberListOpen}
            testId="members-toggle-button"
          />
          <HeaderButton
            icon={<Settings size={18} />}
            tooltip="Settings"
            onClick={() => openModal("userSettings")}
            testId="settings-button"
          />
          <button
            data-testid="user-avatar-button"
            onClick={() => openModal("userSettings")}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-full",
              "bg-background-tertiary/50",
              "transition-all duration-200",
              "hover:bg-background-hover"
            )}
          >
            <div className="avatar avatar-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text-normal hidden xl:block">
              {user?.displayName ?? user?.username}
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dock */}
        <div data-testid="guild-dock" className={cn(
          "flex flex-col items-center py-3 px-2",
          "bg-background-tertiary/50",
          "border-r border-surface-border/30",
          "shadow-e-3 z-e-3",
          "animate-slide-in-left"
        )}>
          <button
            data-testid="sidebar-toggle-button"
            onClick={toggleSidebar}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl mb-3",
              "text-text-muted transition-all duration-300",
              "hover:bg-background-hover hover:text-brand-light",
              "active:scale-90"
            )}
            title={sidebarOpen ? "Hide channels" : "Show channels"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          <div className="w-6 h-px bg-gradient-to-r from-transparent via-surface-border to-transparent mb-3" />

          <div className="flex flex-col gap-2 items-center">
            {guilds.slice(0, 5).map((guild, index) => (
              <DockGuildIcon
                key={guild.id}
                guild={guild}
                isSelected={guild.id === selectedGuildId}
                onClick={() => selectGuild(guild.id)}
                index={index}
              />
            ))}

            {guilds.length > 5 && (
              <button className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-background-secondary text-text-muted text-xs font-bold",
                "transition-all duration-300",
                "hover:rounded-lg hover:bg-background-hover"
              )}>
                +{guilds.length - 5}
              </button>
            )}
          </div>

          <div className="w-6 h-px bg-gradient-to-r from-transparent via-surface-border to-transparent my-3" />

          <button
            data-testid="create-guild-button"
            onClick={() => openModal("createGuild")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "text-green-light transition-all duration-300",
              "hover:bg-green/20 hover:rounded-lg",
              "active:scale-90"
            )}
            title="Create Server"
          >
            <Plus size={18} />
          </button>

          <button
            data-testid="explore-button"
            onClick={() => openModal("discoverServers")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "text-brand-light transition-all duration-300",
              "hover:bg-brand/20 hover:rounded-lg",
              "active:scale-90"
            )}
            title="Explore"
          >
            <Compass size={18} />
          </button>
        </div>

        {/* Channel Panel */}
        <div
          className={cn(
            "overflow-hidden panel-spring",
            sidebarOpen ? "w-[240px]" : "w-0"
          )}
        >
          <div className={cn(
            "w-[240px] h-full",
            "bg-background-secondary/50 backdrop-blur-sm",
            "border-r border-surface-border/30",
            "shadow-e-2",
            "animate-slide-in-left"
          )}
          style={{ animationDelay: "50ms" }}
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
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-background-primary">
          <div className="flex-1 flex flex-col animate-fade-in" style={{ animationDelay: "100ms" }}>
            <ErrorBoundary>
              {isHome ? (
                showFriends ? (
                  <FriendsPage onOpenDM={(id) => { setDmChannelId(id); setShowFriends(false); selectGuild(null); }} />
                ) : dmChannelId ? (
                  <MessageArea channelId={dmChannelId} guildId={null} />
                ) : (
                  <FriendsPage onOpenDM={(id) => { setDmChannelId(id); setShowFriends(false); selectGuild(null); }} />
                )
              ) : selectedChannelId ? (
                <MessageArea channelId={selectedChannelId} guildId={selectedGuildId} />
              ) : (
                <EmptyState />
              )}
            </ErrorBoundary>
          </div>
        </main>

        {/* Member Panel */}
        {selectedGuildId && (
          <div
            className={cn(
              "overflow-hidden panel-spring",
              memberListOpen ? "w-[240px]" : "w-0"
            )}
          >
            <div className={cn(
              "w-[240px] h-full",
              "bg-background-secondary/50 backdrop-blur-sm",
              "border-l border-surface-border/30",
              "shadow-e-1"
            )}>
              <MemberPanel guildId={selectedGuildId} />
            </div>
          </div>
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
      {showClaimModal && <ClaimAccountModal onClose={() => setShowClaimModal(false)} />}
    </div>
  );
}

function HeaderButton({
  icon,
  tooltip,
  onClick,
  active,
  testId,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  testId?: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl",
        "transition-all duration-200",
        active
          ? "bg-brand/15 text-brand-light"
          : "text-text-muted hover:bg-background-hover hover:text-text-normal",
        "active:scale-90"
      )}
      title={tooltip}
    >
      {icon}
    </button>
  );
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
