import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";
import { Home, Server, MessageSquare, Search, User } from "lucide-react";

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "servers" as const, label: "Servers", icon: Server },
  { id: "dms" as const, label: "DMs", icon: MessageSquare },
  { id: "search" as const, label: "Search", icon: Search },
  { id: "profile" as const, label: "Me", icon: User },
];

export function MobileBottomTabs() {
  const { mobileTab, setMobileTab } = useUIStore();

  return (
    <nav className={cn(
      "flex items-center justify-around",
      "h-16 px-2 pb-safe",
      "bg-background-secondary/90 backdrop-blur-xl",
      "border-t border-surface-border/50",
      "shadow-e-2"
    )}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = mobileTab === id;
        return (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl",
              "transition-all duration-200",
              active
                ? "text-brand-light"
                : "text-text-muted"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
