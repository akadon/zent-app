"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 rounded-xl bg-background-tertiary/50 p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "transition-all duration-200",
            activeTab === tab.id
              ? "bg-brand/15 text-brand-light shadow-sm"
              : "text-text-muted hover:bg-background-hover/50 hover:text-text-normal"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
