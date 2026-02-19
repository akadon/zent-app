"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { usePresenceStore } from "@/stores/presence";
import { gateway } from "@/gateway/client";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CreateGuildModal } from "@/components/guild/create-guild-modal";
import { CreateChannelModal } from "@/components/channel/create-channel-modal";
import { InviteModal } from "@/components/guild/invite-modal";
import { UserSettings } from "@/components/settings/user-settings";
import { GuildSettings } from "@/components/settings/guild-settings";
import { toast } from "sonner";
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
      {activeModal === "createThread" && <CreateThreadModal />}
      {activeModal === "channelSettings" && <ChannelSettingsModal />}
      {activeModal === "invitePeople" && <InviteModal />}
      {activeModal === "leaveGuild" && <LeaveGuildModal />}
      {activeModal === "userSettings" && <UserSettings />}
      {activeModal === "guildSettings" && <GuildSettings />}
      {activeModal === "discoverServers" && <DiscoverServersModal />}
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
  const [dmSearch, setDmSearch] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [newDmRecipient, setNewDmRecipient] = useState("");
  const queryClient = useQueryClient();

  const { data: dmChannels = [] } = useQuery({
    queryKey: ["dmChannels"],
    queryFn: () => api.get<DMChannel[]>("/users/@me/channels"),
  });

  const getPresence = usePresenceStore((s) => s.getPresence);

  const createDm = useMutation({
    mutationFn: (recipientId: string) =>
      api.post<DMChannel>("/users/@me/channels", { recipientId }),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ["dmChannels"] });
      onSelectDM(channel.id);
      setShowNewDm(false);
      setNewDmRecipient("");
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to create DM"),
  });

  const filteredDms = dmSearch
    ? dmChannels.filter((dm) => {
        const r = dm.recipients?.[0];
        if (!r) return false;
        const name = (r.displayName ?? r.username).toLowerCase();
        return name.includes(dmSearch.toLowerCase());
      })
    : dmChannels;

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

      {/* DM search input */}
      <div className="relative px-1 mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={dmSearch}
          onChange={(e) => setDmSearch(e.target.value)}
          placeholder="Find a conversation"
          className={cn(
            "w-full rounded-lg bg-background-tertiary/80 pl-8 pr-2 py-1.5",
            "text-xs text-text-normal placeholder:text-text-muted/50",
            "outline-none focus:ring-1 focus:ring-brand/50 transition-all"
          )}
        />
      </div>

      <div className="flex items-center justify-between px-2 py-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        <span>Direct Messages</span>
        <button
          onClick={() => setShowNewDm(!showNewDm)}
          className="rounded p-0.5 hover:bg-background-hover hover:text-text-normal"
          title="New Direct Message"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* New DM input */}
      {showNewDm && (
        <div className="px-1 mb-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newDmRecipient.trim()) createDm.mutate(newDmRecipient.trim());
            }}
            className="flex gap-1"
          >
            <input
              type="text"
              value={newDmRecipient}
              onChange={(e) => setNewDmRecipient(e.target.value)}
              placeholder="Enter user ID"
              className={cn(
                "flex-1 rounded-lg bg-background-tertiary/80 px-2.5 py-1.5",
                "text-xs text-text-normal placeholder:text-text-muted/50",
                "outline-none focus:ring-1 focus:ring-brand/50 transition-all"
              )}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newDmRecipient.trim() || createDm.isPending}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium",
                "bg-brand text-white hover:bg-brand-hover",
                "disabled:opacity-50 transition-colors"
              )}
            >
              {createDm.isPending ? "..." : "Go"}
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {filteredDms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted">
            <MessageSquare size={24} className="opacity-30 mb-2" />
            <p className="text-xs">{dmSearch ? "No matches" : "No recent DMs"}</p>
          </div>
        ) : (
          filteredDms.map((dm) => {
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

function CreateThreadModal() {
  const { modalData, closeModal } = useUIStore();
  const channelId = modalData.channelId as string | undefined;
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const createThread = useMutation({
    mutationFn: () => api.post(`/channels/${channelId}/threads`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Thread created");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to create thread"),
  });

  if (!channelId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-header-primary">Create Thread</h2>
        <div className="mb-4">
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">Thread Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New thread"
            maxLength={100}
            className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-normal">Cancel</button>
          <button
            onClick={() => createThread.mutate()}
            disabled={!name.trim() || createThread.isPending}
            className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {createThread.isPending ? "Creating..." : "Create Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelSettingsModal() {
  const { modalData, closeModal } = useUIStore();
  const channelId = modalData.channelId as string | undefined;
  const guildId = modalData.guildId as string | undefined;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");

  const { data: channel } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => api.get<Channel>(`/channels/${channelId}`),
    enabled: !!channelId,
  });

  useEffect(() => {
    if (channel) {
      setName(channel.name ?? "");
      setTopic((channel as any).topic ?? "");
    }
  }, [channel]);

  const updateChannel = useMutation({
    mutationFn: () => api.patch(`/channels/${channelId}`, { name: name || undefined, topic: topic || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Channel updated");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to update channel"),
  });

  const deleteChannel = useMutation({
    mutationFn: () => api.delete(`/channels/${channelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Channel deleted");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to delete channel"),
  });

  if (!channelId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-bold text-header-primary">Channel Settings</h2>
        <div className="mb-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              maxLength={1024}
              className="w-full resize-none rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this channel?")) deleteChannel.mutate();
            }}
            className="text-sm text-red hover:underline"
          >
            Delete Channel
          </button>
          <div className="flex gap-3">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-normal">Cancel</button>
            <button
              onClick={() => updateChannel.mutate()}
              disabled={updateChannel.isPending}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {updateChannel.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveGuildModal() {
  const { modalData, closeModal } = useUIStore();
  const guildId = modalData.guildId as string | undefined;
  const guildName = modalData.guildName as string | undefined;
  const queryClient = useQueryClient();
  const removeGuild = useGuildStore((s) => s.removeGuild);

  const leaveGuild = useMutation({
    mutationFn: () => api.delete(`/users/@me/guilds/${guildId}`),
    onSuccess: () => {
      if (guildId) removeGuild(guildId);
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Left server");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to leave server"),
  });

  if (!guildId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-bold text-header-primary">Leave Server</h2>
        <p className="mb-6 text-sm text-text-muted">
          Are you sure you want to leave <span className="font-semibold text-text-normal">{guildName ?? "this server"}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-normal">Cancel</button>
          <button
            onClick={() => leaveGuild.mutate()}
            disabled={leaveGuild.isPending}
            className="rounded-[3px] bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover disabled:opacity-50"
          >
            {leaveGuild.isPending ? "Leaving..." : "Leave Server"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoverServersModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");

  const joinServer = useMutation({
    mutationFn: (code: string) => api.post(`/invites/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Joined server");
      closeModal();
    },
    onError: (err: any) => toast.error(err.message ?? "Invalid invite code"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="w-[440px] rounded-lg bg-background-secondary p-6" onClick={(e) => e.stopPropagation()}>
        <Compass size={48} className="mx-auto mb-4 text-brand-light" />
        <h2 className="mb-2 text-lg font-bold text-header-primary text-center">Join a Server</h2>
        <p className="mb-4 text-sm text-text-muted text-center">
          Enter an invite code to join an existing server.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteCode.trim()) joinServer.mutate(inviteCode.trim());
          }}
        >
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
            Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="hTKzmak"
            className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-normal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim() || joinServer.isPending}
              className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {joinServer.isPending ? "Joining..." : "Join Server"}
            </button>
          </div>
        </form>
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

