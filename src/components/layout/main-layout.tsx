"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { usePresenceStore } from "@/stores/presence";
import { gateway } from "@/gateway/client";
import { CreateGuildModal } from "@/components/guild/create-guild-modal";
import { CreateChannelModal } from "@/components/channel/create-channel-modal";
import { InviteModal } from "@/components/guild/invite-modal";
import { UserSettings } from "@/components/settings/user-settings";
import { GuildSettings } from "@/components/settings/guild-settings";
import { FriendsPage } from "@/components/friends/friends-page";
import { MessageArea } from "@/components/message/message-area";
import { cn } from "@/lib/utils";
import type { Guild, Channel } from "@yxc/types";
import { ChannelType } from "@yxc/types";
import {
  Home,
  Search,
  Settings,
  Users,
  Plus,
  Compass,
  Hash,
  Volume2,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Bell,
  Command,
  X,
  Radio,
  Sparkles,
} from "lucide-react";

export function MainLayout() {
  const { user, token } = useAuthStore();
  const { activeModal, memberListOpen, toggleMemberList, openModal } = useUIStore();
  const {
    guilds: gatewayGuilds,
    selectedGuildId,
    selectedChannelId,
    selectGuild,
    selectChannel,
    initGatewayHandlers,
  } = useGuildStore();
  const initPresenceHandlers = usePresenceStore((s) => s.initPresenceHandlers);

  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFriends, setShowFriends] = useState(true);
  const [dmChannelId, setDmChannelId] = useState<string | null>(null);

  // Connect gateway
  useEffect(() => {
    if (token) {
      gateway.connect(token);
      const cleanupGuild = initGatewayHandlers();
      const cleanupPresence = initPresenceHandlers();
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => {
        cleanupGuild();
        cleanupPresence();
        gateway.disconnect();
        clearTimeout(timer);
      };
    }
  }, [token, initGatewayHandlers, initPresenceHandlers]);

  // Fetch guilds
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

  // Keyboard shortcut for quick switcher
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
      className={cn(
        "flex h-screen flex-col overflow-hidden",
        "bg-background-primary",
        "transition-opacity duration-500",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          UNIFIED HEADER BAR - Unique top navigation
      ═══════════════════════════════════════════════════════════════════ */}
      <header className={cn(
        "flex h-14 items-center justify-between px-4",
        "bg-background-secondary/80 backdrop-blur-xl",
        "border-b border-surface-border/50",
        "animate-fade-in-down"
      )}>
        {/* Left: Logo + Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Logo */}
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

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1 text-sm">
            <button
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
              <ChannelBreadcrumb
                guildId={selectedGuild.id}
                channelId={selectedChannelId}
              />
            )}
          </nav>
        </div>

        {/* Center: Quick Switcher Button */}
        <button
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <HeaderButton icon={<Bell size={18} />} tooltip="Notifications" />
          <HeaderButton
            icon={<Users size={18} />}
            tooltip="Toggle Members"
            onClick={toggleMemberList}
            active={memberListOpen}
          />
          <HeaderButton
            icon={<Settings size={18} />}
            tooltip="Settings"
            onClick={() => openModal("userSettings")}
          />

          {/* User Avatar */}
          <button
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

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─────────────────────────────────────────────────────────────────
            FLOATING DOCK - Compact guild navigation
        ───────────────────────────────────────────────────────────────── */}
        <div className={cn(
          "flex flex-col items-center py-3 px-2",
          "bg-background-tertiary/50",
          "border-r border-surface-border/30",
          "animate-slide-in-left"
        )}>
          {/* Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
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

          {/* Divider */}
          <div className="w-6 h-px bg-gradient-to-r from-transparent via-surface-border to-transparent mb-3" />

          {/* Guild Icons - Compact Dock Style */}
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

          {/* Divider */}
          <div className="w-6 h-px bg-gradient-to-r from-transparent via-surface-border to-transparent my-3" />

          {/* Quick Actions */}
          <button
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

        {/* ─────────────────────────────────────────────────────────────────
            SLIDE-OVER CHANNEL PANEL
        ───────────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-400 ease-smooth",
            sidebarOpen ? "w-[240px]" : "w-0"
          )}
        >
          <div className={cn(
            "w-[240px] h-full",
            "bg-background-secondary/50 backdrop-blur-sm",
            "border-r border-surface-border/30",
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

        {/* ─────────────────────────────────────────────────────────────────
            MAIN CHAT AREA - Centered with max-width
        ───────────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-background-primary">
          <div className={cn(
            "flex-1 flex flex-col",
            "animate-fade-in"
          )}
          style={{ animationDelay: "100ms" }}
          >
            {isHome ? (
              showFriends ? (
                <FriendsPage />
              ) : dmChannelId ? (
                <MessageArea channelId={dmChannelId} guildId={null} />
              ) : (
                <FriendsPage />
              )
            ) : selectedChannelId ? (
              <MessageArea channelId={selectedChannelId} guildId={selectedGuildId} />
            ) : (
              <EmptyState />
            )}
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────────────
            SLIDE-OVER MEMBER PANEL
        ───────────────────────────────────────────────────────────────── */}
        {selectedGuildId && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-400 ease-smooth",
              memberListOpen ? "w-[240px]" : "w-0"
            )}
          >
            <div className={cn(
              "w-[240px] h-full",
              "bg-background-secondary/50 backdrop-blur-sm",
              "border-l border-surface-border/30"
            )}>
              <MemberPanel guildId={selectedGuildId} />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === "createGuild" && <CreateGuildModal />}
      {activeModal === "createChannel" && <CreateChannelModal />}
      {activeModal === "invitePeople" && <InviteModal />}
      {activeModal === "userSettings" && <UserSettings />}
      {activeModal === "guildSettings" && <GuildSettings />}
      {/* QuickSwitcher is rendered in providers.tsx */}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ZentLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 5h12a1 1 0 011 1v1a1 1 0 01-.293.707L9.414 17H18a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1a1 1 0 01.293-.707L14.586 7H6a1 1 0 01-1-1V5a1 1 0 011-1z"
        fill="currentColor"
      />
      <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function HeaderButton({
  icon,
  tooltip,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
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

function DockGuildIcon({
  guild,
  isSelected,
  onClick,
  index,
}: {
  guild: Guild;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const initials = guild.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="relative animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
    >
      {/* Selection indicator */}
      <div className={cn(
        "absolute -left-2 top-1/2 w-1 -translate-y-1/2 rounded-r-full",
        "bg-gradient-to-b from-brand-light to-brand",
        "transition-all duration-300",
        isSelected ? "h-6 opacity-100" : "h-0 opacity-0"
      )} />

      <button
        onClick={onClick}
        className={cn(
          "flex h-10 w-10 items-center justify-center",
          "transition-all duration-300 ease-smooth",
          isSelected
            ? "rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-glow-sm"
            : "rounded-2xl bg-background-secondary text-text-muted hover:rounded-xl hover:bg-brand/80 hover:text-white",
          "active:scale-90"
        )}
        title={guild.name}
      >
        {guild.icon ? (
          <img src={guild.icon} alt={guild.name} className="h-full w-full rounded-[inherit] object-cover" />
        ) : (
          <span className="text-xs font-bold">{initials}</span>
        )}
      </button>
    </div>
  );
}

function ChannelBreadcrumb({ guildId, channelId }: { guildId: string; channelId: string }) {
  const { data: channels = [] } = useQuery({
    queryKey: ["channels", guildId],
    queryFn: () => api.get<Channel[]>(`/guilds/${guildId}/channels`),
  });

  const channel = channels.find(c => c.id === channelId);
  if (!channel) return null;

  const Icon = channel.type === ChannelType.GUILD_VOICE ? Volume2 :
               channel.type === ChannelType.GUILD_STAGE_VOICE ? Radio : Hash;

  return (
    <>
      <ChevronRight size={14} className="text-text-muted/50" />
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
        "bg-brand/10 text-brand-light"
      )}>
        <Icon size={14} />
        <span className="font-medium">{channel.name}</span>
      </div>
    </>
  );
}

function HomeSidebar({
  onSelectFriends,
  onSelectDM,
  selectedDmId,
  showingFriends,
}: {
  onSelectFriends: () => void;
  onSelectDM: (id: string) => void;
  selectedDmId: string | null;
  showingFriends: boolean;
}) {
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

      <div className="flex-1 overflow-y-auto space-y-1">
        {/* DM list would go here */}
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <MessageSquare size={24} className="opacity-30 mb-2" />
          <p className="text-xs">No recent DMs</p>
        </div>
      </div>
    </div>
  );
}

function ChannelPanel({
  guild,
  selectedChannelId,
  onSelectChannel,
}: {
  guild: Guild;
  selectedChannelId: string | null;
  onSelectChannel: (id: string) => void;
}) {
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
        {/* Uncategorized */}
        {uncategorized.sort((a, b) => a.position - b.position).map(channel => (
          <ChannelButton
            key={channel.id}
            channel={channel}
            isSelected={channel.id === selectedChannelId}
            onClick={() => onSelectChannel(channel.id)}
          />
        ))}

        {/* Categories */}
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

function MemberPanel({ guildId }: { guildId: string }) {
  const { data: members = [] } = useQuery({
    queryKey: ["members", guildId],
    queryFn: () => api.get<any[]>(`/guilds/${guildId}/members`),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border/30">
        <h3 className="font-bold text-header-primary text-sm">Members — {members.length}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {members.slice(0, 20).map((member, i) => (
          <div
            key={member.userId || i}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg",
              "hover:bg-background-hover/30 cursor-pointer",
              "transition-colors duration-150"
            )}
          >
            <div className="avatar avatar-sm">
              {member.user?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm text-text-normal truncate">
              {member.nickname || member.user?.displayName || member.user?.username || "Unknown"}
            </span>
          </div>
        ))}
      </div>
    </div>
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

