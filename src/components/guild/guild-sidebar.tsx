import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";
import type { Guild } from "@yxc/types";
import { Plus, Compass, Sparkles } from "lucide-react";

interface GuildSidebarProps {
  guilds: Guild[];
  selectedGuildId: string | null;
  onSelectGuild: (id: string | null) => void;
}

export function GuildSidebar({
  guilds,
  selectedGuildId,
  onSelectGuild,
}: GuildSidebarProps) {
  const openModal = useUIStore((s) => s.openModal);

  return (
    <nav className="flex w-[76px] flex-col items-center gap-3 overflow-y-auto bg-background-tertiary py-4 scrollbar-none">
      {/* Home / DMs button - Unique hexagonal design */}
      <GuildIcon
        name="Home"
        isSelected={selectedGuildId === null}
        onClick={() => onSelectGuild(null as any)}
        isHome
      />

      {/* Animated divider */}
      <div className="relative mx-auto w-10">
        <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
        <div className="absolute inset-0 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-brand/60 to-transparent animate-pulse-soft" />
      </div>

      {/* Guild icons with stagger animation */}
      <div className="flex flex-col gap-3">
        {guilds.map((guild, index) => (
          <div
            key={guild.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
          >
            <GuildIcon
              name={guild.name}
              icon={guild.icon}
              isSelected={guild.id === selectedGuildId}
              onClick={() => onSelectGuild(guild.id)}
            />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-auto h-[2px] w-10 rounded-full bg-gradient-to-r from-transparent via-surface-border to-transparent" />

      {/* Add server - unique floating button */}
      <GuildActionButton
        icon={<Plus size={20} strokeWidth={2.5} />}
        tooltip="Create Server"
        onClick={() => openModal("createGuild")}
        variant="success"
      />

      {/* Discover servers */}
      <GuildActionButton
        icon={<Compass size={20} />}
        tooltip="Explore Public Servers"
        onClick={() => openModal("discoverServers")}
        variant="brand"
      />
    </nav>
  );
}

function GuildIcon({
  name,
  icon,
  isSelected,
  isHome,
  onClick,
}: {
  name: string;
  icon?: string | null;
  isSelected: boolean;
  isHome?: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection indicator - animated vertical bar */}
      <div
        className={cn(
          "absolute -left-1 top-1/2 w-1 -translate-y-1/2 rounded-r-full",
          "transition-all duration-400 ease-smooth",
          isSelected
            ? "h-10 bg-gradient-to-b from-brand-light to-brand opacity-100"
            : isHovered
              ? "h-6 bg-brand/70 opacity-100"
              : "h-0 opacity-0"
        )}
      />

      {/* Tooltip with arrow */}
      <div
        className={cn(
          "absolute left-full top-1/2 z-50 ml-5 -translate-y-1/2 whitespace-nowrap",
          "rounded-xl px-4 py-2.5 text-sm font-semibold",
          "bg-background-floating/95 backdrop-blur-xl",
          "text-header-primary shadow-elevated",
          "border border-surface-border",
          "transition-all duration-250 ease-smooth",
          isHovered
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-3 pointer-events-none"
        )}
      >
        {name}
        {/* Arrow */}
        <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-background-floating/95 border-l border-b border-surface-border" />
      </div>

      <button
        onClick={onClick}
        className={cn(
          "relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden",
          "transition-all duration-400 ease-smooth",
          isSelected
            ? "rounded-[18px]"
            : "rounded-[24px] hover:rounded-[18px]",
          "active:scale-[0.92]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background-tertiary"
        )}
      >
        {/* Background with gradient */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-400",
            isSelected
              ? "bg-gradient-to-br from-brand via-brand to-brand-dark"
              : "bg-gradient-to-br from-background-hover to-background-secondary"
          )}
        />

        {/* Hover overlay */}
        {!isSelected && (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              "bg-gradient-to-br from-brand/80 to-brand-dark/80",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          {icon ? (
            <img
              src={icon}
              alt={name}
              className="h-[52px] w-[52px] rounded-[inherit] object-cover"
            />
          ) : isHome ? (
            <ZentLogo className={cn(
              "h-7 w-7 transition-all duration-300",
              isSelected || isHovered ? "text-white" : "text-brand-light"
            )} />
          ) : (
            <span className={cn(
              "text-sm font-bold tracking-tight transition-colors duration-300",
              isSelected || isHovered ? "text-white" : "text-text-normal"
            )}>
              {initials}
            </span>
          )}
        </div>

        {/* Glow effect on selected */}
        {isSelected && (
          <div className="absolute inset-0 animate-glow-pulse rounded-[18px]" />
        )}
      </button>
    </div>
  );
}

function GuildActionButton({
  icon,
  tooltip,
  onClick,
  variant = "brand",
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  variant?: "brand" | "success";
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    brand: {
      default: "text-brand-light border-brand/20",
      hover: "bg-brand text-white border-brand shadow-glow-sm",
    },
    success: {
      default: "text-green-light border-green/20",
      hover: "bg-green text-white border-green shadow-[0_0_20px_rgba(0,212,170,0.3)]",
    },
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      <div
        className={cn(
          "absolute left-full top-1/2 z-50 ml-5 -translate-y-1/2 whitespace-nowrap",
          "rounded-xl px-4 py-2.5 text-sm font-semibold",
          "bg-background-floating/95 backdrop-blur-xl",
          "text-header-primary shadow-elevated",
          "border border-surface-border",
          "transition-all duration-250 ease-smooth",
          isHovered
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-3 pointer-events-none"
        )}
      >
        {tooltip}
        <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-background-floating/95 border-l border-b border-surface-border" />
      </div>

      <button
        onClick={onClick}
        className={cn(
          "flex h-[52px] w-[52px] items-center justify-center",
          "rounded-[24px] border-2",
          "bg-background-secondary/50",
          "transition-all duration-400 ease-smooth",
          "hover:rounded-[18px]",
          "active:scale-[0.92]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          variantStyles[variant].default,
          isHovered && variantStyles[variant].hover
        )}
      >
        {icon}
      </button>
    </div>
  );
}

// Custom Zent logo - Modern "Z" with digital/cyber aesthetic
function ZentLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Main Z shape with gradient */}
      <path
        d="M6 5h12a1 1 0 011 1v1a1 1 0 01-.293.707L9.414 17H18a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1a1 1 0 01.293-.707L14.586 7H6a1 1 0 01-1-1V5a1 1 0 011-1z"
        fill="currentColor"
      />
      {/* Accent dot */}
      <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.8" />
      {/* Top highlight */}
      <path
        d="M6 5h12a1 1 0 011 1v0.5H5V6a1 1 0 011-1z"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}
