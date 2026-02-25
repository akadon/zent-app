import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";
import { Plus, Compass } from "lucide-react";

interface MobileServerViewProps {
  guilds: Guild[];
}

export function MobileServerView({ guilds }: MobileServerViewProps) {
  const { selectGuild, openModal } = useUIStore();

  return (
    <div className="flex flex-col h-full">
      {/* Horizontal scrollable server icons */}
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-none">
        {guilds.map((guild) => {
          const initials = guild.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <button
              key={guild.id}
              onClick={() => selectGuild(guild.id)}
              className={cn(
                "flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl",
                "bg-background-secondary text-text-muted",
                "transition-all duration-200",
                "active:scale-90"
              )}
              title={guild.name}
            >
              {guild.icon ? (
                <img src={guild.icon} alt={guild.name} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <span className="text-sm font-bold">{initials}</span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => openModal("createGuild")}
          className={cn(
            "flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl",
            "border-2 border-dashed border-surface-border/50",
            "text-text-muted",
            "active:scale-90"
          )}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="w-full h-px bg-surface-border/30" />

      {/* Server list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {guilds.map((guild) => {
          const initials = guild.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <button
              key={guild.id}
              onClick={() => selectGuild(guild.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
                "transition-all duration-200",
                "hover:bg-background-hover/50 active:bg-background-hover"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0",
                "bg-background-secondary text-text-muted"
              )}>
                {guild.icon ? (
                  <img src={guild.icon} alt={guild.name} className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <span className="text-xs font-bold">{initials}</span>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-text-normal truncate">{guild.name}</p>
              </div>
            </button>
          );
        })}

        <button
          onClick={() => openModal("discoverServers")}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
            "text-brand-light",
            "transition-all duration-200",
            "hover:bg-brand/10"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Compass size={18} />
          </div>
          <span className="text-sm font-medium">Explore Servers</span>
        </button>
      </div>
    </div>
  );
}
