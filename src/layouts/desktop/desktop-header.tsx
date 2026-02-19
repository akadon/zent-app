"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { ZentLogo } from "@/shared/components/zent-logo";
import { ChannelBreadcrumb } from "@/features/channels/components/channel-breadcrumb";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";
import {
  Home, Search, Settings, Users, Bell, Command, ChevronRight,
} from "lucide-react";

interface DesktopHeaderProps {
  guilds: Guild[];
  selectedGuild: Guild | null;
}

export function DesktopHeader({ guilds, selectedGuild }: DesktopHeaderProps) {
  const { user } = useAuthStore();
  const {
    openModal, toggleMemberList, memberListOpen,
    selectedGuildId, selectedChannelId, selectGuild, setShowFriends,
  } = useUIStore();
  const isHome = selectedGuildId === null;

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
        <IconBtn icon={<Bell size={18} />} tooltip="Notifications" />
        <IconBtn
          icon={<Users size={18} />}
          tooltip="Toggle Members"
          onClick={toggleMemberList}
          active={memberListOpen}
        />
        <IconBtn
          icon={<Settings size={18} />}
          tooltip="Settings"
          onClick={() => openModal("userSettings")}
        />
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
  );
}

function IconBtn({ icon, tooltip, onClick, active }: {
  icon: React.ReactNode; tooltip: string; onClick?: () => void; active?: boolean;
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
