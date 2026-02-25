import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";

interface DockGuildIconProps {
  guild: Guild;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function DockGuildIcon({ guild, isSelected, onClick, index }: DockGuildIconProps) {
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
