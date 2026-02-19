"use client";

import { useUIStore } from "@/stores/ui";
import { DockGuildIcon } from "@/features/guilds/components/guild-dock-icon";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";
import { PanelLeftClose, PanelLeft, Plus, Compass } from "lucide-react";

interface DesktopDockProps {
  guilds: Guild[];
}

export function DesktopDock({ guilds }: DesktopDockProps) {
  const {
    selectedGuildId, selectGuild, openModal,
    sidebarOpen, toggleSidebar,
  } = useUIStore();

  return (
    <div className={cn(
      "flex flex-col items-center py-3 px-2",
      "bg-background-tertiary/50",
      "border-r border-surface-border/30",
      "shadow-e-3 z-e-3",
      "animate-slide-in-left"
    )}>
      <button
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
  );
}
