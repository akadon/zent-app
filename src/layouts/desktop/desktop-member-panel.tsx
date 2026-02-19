"use client";

import { MemberPanel } from "@/features/members/components/member-panel";
import { cn } from "@/lib/utils";

interface DesktopMemberPanelProps {
  guildId: string;
  width: number;
}

export function DesktopMemberPanel({ guildId, width }: DesktopMemberPanelProps) {
  return (
    <div
      className={cn(
        "h-full",
        "bg-background-secondary/50 backdrop-blur-sm",
        "border-l border-surface-border/30",
        "shadow-e-1"
      )}
      style={{ width }}
    >
      <MemberPanel guildId={guildId} />
    </div>
  );
}
