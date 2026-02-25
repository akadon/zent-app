import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { ZentLogo } from "@/shared/components/zent-logo";
import { cn } from "@/lib/utils";
import type { Guild } from "@yxc/types";
import { Bell, Settings } from "lucide-react";

interface MobileHeaderProps {
  selectedGuild: Guild | null;
}

export function MobileHeader({ selectedGuild }: MobileHeaderProps) {
  const { user } = useAuthStore();
  const { openModal, mobileTab, selectedGuildId } = useUIStore();

  const title = mobileTab === "servers" && selectedGuild
    ? selectedGuild.name
    : mobileTab === "home" ? "Home"
    : mobileTab === "dms" ? "Messages"
    : mobileTab === "search" ? "Search"
    : mobileTab === "profile" ? "Profile"
    : "Zent";

  return (
    <header className={cn(
      "flex h-12 items-center justify-between px-4",
      "bg-background-secondary/80 backdrop-blur-xl",
      "border-b border-surface-border/50",
      "shadow-e-2 z-e-2"
    )}>
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          "bg-gradient-to-br from-brand to-brand-dark"
        )}>
          <ZentLogo className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-header-primary text-sm">{title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-hover"
          title="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          onClick={() => openModal("userSettings")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-hover"
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => openModal("userSettings")}
          className="avatar avatar-xs ml-1"
        >
          {user?.username?.[0]?.toUpperCase()}
        </button>
      </div>
    </header>
  );
}
