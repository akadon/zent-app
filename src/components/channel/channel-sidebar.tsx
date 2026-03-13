import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { ChannelType } from "@yxc/types";
import type { Channel, Guild } from "@yxc/types";
import {
  Hash,
  Volume2,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Mic,
  Headphones,
  Radio,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGuildStore } from "@/stores/guild";
import { MicOff, VolumeX } from "lucide-react";
import { ChannelSearch } from "./channel-search";
import { StatusPicker } from "@/components/layout/status-picker";
import { VoicePanel } from "@/components/voice/voice-panel";

interface ChannelSidebarProps {
  guild: Guild;
  selectedChannelId: string | null;
  onSelectChannel: (id: string) => void;
}

export function ChannelSidebar({
  guild,
  selectedChannelId,
  onSelectChannel,
}: ChannelSidebarProps) {
  const { user } = useAuthStore();
  const openModal = useUIStore((s) => s.openModal);

  const [searchQuery, setSearchQuery] = useState("");
  const [voiceChannelId, setVoiceChannelId] = useState<string | null>(null);
  const [voiceChannelName, setVoiceChannelName] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const { data: channels = [] } = useQuery({
    queryKey: ["channels", guild.id],
    queryFn: () => api.get<Channel[]>(`/guilds/${guild.id}/channels`),
  });

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) => c.type === ChannelType.GUILD_CATEGORY || c.name?.toLowerCase().includes(q)
    );
  }, [channels, searchQuery]);

  const categories = filteredChannels.filter((c) => c.type === ChannelType.GUILD_CATEGORY);
  const uncategorized = filteredChannels.filter(
    (c) => c.type !== ChannelType.GUILD_CATEGORY && !c.parentId
  );

  const channelsByCategory = new Map<string | null, Channel[]>();
  channelsByCategory.set(null, uncategorized);
  for (const cat of categories) {
    channelsByCategory.set(
      cat.id,
      filteredChannels
        .filter((c) => c.parentId === cat.id)
        .sort((a, b) => a.position - b.position)
    );
  }

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="flex w-[260px] flex-col bg-background-secondary">
      {/* Guild header with gradient accent */}
      <button
        onClick={() => openModal("guildSettings", { guildId: guild.id, guildName: guild.name })}
        className={cn(
          "group relative flex h-14 items-center justify-between px-5",
          "border-b border-surface-border/50",
          "transition-all duration-300",
          "hover:bg-background-hover/30"
        )}
      >
        {/* Gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand/50 via-accent-cyan/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <span className="relative z-10 truncate font-bold text-header-primary text-[15px]">
          {guild.name}
        </span>
        <ChevronDown
          size={18}
          className="relative z-10 text-text-muted transition-all duration-300 group-hover:text-brand-light group-hover:translate-y-0.5"
        />
      </button>

      {/* Channel search */}
      <div className="px-3 pt-4 pb-2">
        <ChannelSearch onSearch={setSearchQuery} />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3 scrollbar-thin">
        {/* Uncategorized channels */}
        {uncategorized
          .sort((a, b) => a.position - b.position)
          .map((channel, index) => (
            <div
              key={channel.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 25}ms`, animationFillMode: "backwards" }}
            >
              <ChannelItem
                channel={channel}
                isSelected={channel.id === selectedChannelId}
                onClick={() => onSelectChannel(channel.id)}
                onVoiceConnect={(id, name) => { setVoiceChannelId(id); setVoiceChannelName(name); }}
                guildId={guild.id}
              />
            </div>
          ))}

        {/* Categories with channels */}
        {categories
          .sort((a, b) => a.position - b.position)
          .map((category, catIndex) => {
            const isCollapsed = collapsedCategories.has(category.id);
            const categoryChannels = channelsByCategory.get(category.id) ?? [];

            return (
              <div
                key={category.id}
                className="mt-5 animate-fade-in"
                style={{ animationDelay: `${(catIndex + uncategorized.length) * 25}ms`, animationFillMode: "backwards" }}
              >
                {/* Category header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCategory(category.id)}
                  onKeyDown={(e) => e.key === "Enter" && toggleCategory(category.id)}
                  className={cn(
                    "group flex w-full items-center gap-1.5 px-1 py-2 cursor-pointer",
                    "text-[11px] font-bold uppercase tracking-wider text-text-muted",
                    "transition-colors duration-200",
                    "hover:text-text-normal"
                  )}
                >
                  <ChevronRight
                    size={11}
                    className={cn(
                      "transition-transform duration-250 ease-smooth",
                      !isCollapsed && "rotate-90"
                    )}
                  />
                  <span className="truncate">{category.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("createChannel", { guildId: guild.id });
                    }}
                    className={cn(
                      "ml-auto rounded-lg p-1",
                      "opacity-0 transition-all duration-200",
                      "hover:bg-brand/10 hover:text-brand-light",
                      "group-hover:opacity-100"
                    )}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Channel list with collapse animation */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-350 ease-smooth",
                    isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                  )}
                >
                  {categoryChannels.map((channel, index) => (
                    <div
                      key={channel.id}
                      className={cn(
                        "transition-all duration-250",
                        !isCollapsed && "animate-fade-in"
                      )}
                      style={{
                        animationDelay: isCollapsed ? "0ms" : `${index * 25}ms`,
                        animationFillMode: "backwards"
                      }}
                    >
                      <ChannelItem
                        channel={channel}
                        isSelected={channel.id === selectedChannelId}
                        onClick={() => onSelectChannel(channel.id)}
                        onVoiceConnect={(id, name) => { setVoiceChannelId(id); setVoiceChannelName(name); }}
                        guildId={guild.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Voice panel */}
      {voiceChannelId && (
        <div className="animate-slide-in-up">
          <VoicePanel
            channelName={voiceChannelName}
            guildName={guild.name}
            guildId={guild.id}
            channelId={voiceChannelId}
            onDisconnect={() => setVoiceChannelId(null)}
          />
        </div>
      )}

      {/* User panel - unique design */}
      <div className={cn(
        "flex items-center gap-3 px-3 py-3",
        "bg-background-tertiary/60 backdrop-blur-sm",
        "border-t border-surface-border/50"
      )}>
        <StatusPicker>
          <div className="relative cursor-pointer group">
            <div className={cn(
              "avatar avatar-sm",
              "transition-all duration-300 group-hover:scale-105 group-hover:shadow-glow-sm"
            )}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="status-indicator status-indicator-sm bg-status-online" />
          </div>
        </StatusPicker>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-header-primary">
            {user?.displayName ?? user?.username}
          </p>
          <p className="truncate text-xs text-brand-light/80">Online</p>
        </div>

        <div className="flex gap-1">
          <MuteDeafenButtons />
          <IconButton
            icon={<Settings size={18} />}
            tooltip="User Settings"
            onClick={() => openModal("userSettings")}
          />
        </div>
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  isSelected,
  onClick,
  onVoiceConnect,
  guildId,
}: {
  channel: Channel;
  isSelected: boolean;
  onClick: () => void;
  onVoiceConnect?: (channelId: string, channelName: string) => void;
  guildId: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const openModal = useUIStore((s) => s.openModal);

  const isVoice =
    channel.type === ChannelType.GUILD_VOICE ||
    channel.type === ChannelType.GUILD_STAGE_VOICE;

  const handleClick = () => {
    if (isVoice && onVoiceConnect) {
      onVoiceConnect(channel.id, channel.name ?? "Voice Channel");
    } else {
      onClick();
    }
  };

  const Icon = channel.type === ChannelType.GUILD_STAGE_VOICE
    ? Radio
    : isVoice
      ? Volume2
      : Hash;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 my-0.5 cursor-pointer",
        "text-sm transition-all duration-200 ease-smooth",
        isSelected
          ? "bg-brand/12 text-brand-light"
          : "text-channel-default hover:bg-background-hover/40 hover:text-channel-hover"
      )}
    >
      {/* Selection indicator - gradient bar */}
      <div
        className={cn(
          "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full",
          "transition-all duration-250 ease-smooth",
          "bg-gradient-to-b from-brand-light to-brand",
          isSelected ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
        )}
      />

      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors duration-200",
          isSelected ? "text-brand-light" : "text-text-muted"
        )}
      />

      <span className="truncate font-medium">{channel.name}</span>

      {/* Hover actions */}
      <div
        className={cn(
          "ml-auto flex items-center gap-1 transition-all duration-200",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal("createThread", { channelId: channel.id });
          }}
          className={cn(
            "rounded-lg p-1.5 text-text-muted",
            "transition-all duration-200",
            "hover:bg-brand/15 hover:text-brand-light"
          )}
          title="Create Thread"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal("channelSettings", { channelId: channel.id, channelName: channel.name });
          }}
          className={cn(
            "rounded-lg p-1.5 text-text-muted",
            "transition-all duration-200",
            "hover:bg-brand/15 hover:text-brand-light"
          )}
          title="Edit Channel"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}

function MuteDeafenButtons() {
  const voiceConnection = useGuildStore((s) => s.voiceConnection);
  const { toggleSelfMute, toggleSelfDeaf } = useGuildStore();
  const selfMute = voiceConnection?.selfMute ?? false;
  const selfDeaf = voiceConnection?.selfDeaf ?? false;

  return (
    <>
      <IconButton
        icon={selfMute ? <MicOff size={18} /> : <Mic size={18} />}
        tooltip={selfMute ? "Unmute" : "Mute"}
        onClick={toggleSelfMute}
        active={selfMute}
      />
      <IconButton
        icon={selfDeaf ? <VolumeX size={18} /> : <Headphones size={18} />}
        tooltip={selfDeaf ? "Undeafen" : "Deafen"}
        onClick={toggleSelfDeaf}
        active={selfDeaf}
      />
    </>
  );
}

function IconButton({
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
        "flex items-center justify-center rounded-xl p-2",
        "transition-all duration-200",
        "active:scale-90",
        active
          ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
          : "text-text-muted hover:bg-brand/10 hover:text-brand-light"
      )}
      title={tooltip}
    >
      {icon}
    </button>
  );
}
