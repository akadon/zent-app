"use client";

import { MessageArea } from "@/components/message/message-area";
import { cn } from "@/lib/utils";
import { ChevronLeft, Users } from "lucide-react";

interface MobileChatViewProps {
  channelId: string;
  guildId: string | null;
  guildName?: string;
  onBack: () => void;
}

export function MobileChatView({ channelId, guildId, guildName, onBack }: MobileChatViewProps) {
  return (
    <div className="flex flex-col h-full">
      <header className={cn(
        "flex h-12 items-center gap-2 px-2",
        "bg-background-secondary/80 backdrop-blur-xl",
        "border-b border-surface-border/50",
        "shadow-e-2 z-e-2"
      )}>
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-hover"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-header-primary text-sm truncate flex-1">
          {guildName || "Direct Message"}
        </span>
        {guildId && (
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-hover">
            <Users size={16} />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-hidden">
        <MessageArea channelId={channelId} guildId={guildId} />
      </main>
    </div>
  );
}
