"use client";

import { useEffect, useState, useMemo } from "react";
import { useGuildStore } from "@/stores/guild";
import { useAuthStore } from "@/stores/auth";

interface TypingIndicatorProps {
  channelId: string;
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const typingUsers = useGuildStore((s) => s.typingUsers);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [tick, forceUpdate] = useState(0);

  const channelTyping = typingUsers.get(channelId);
  const hasTypers = channelTyping && channelTyping.size > 0;

  // Only run interval when there are active typers
  useEffect(() => {
    if (!hasTypers) return;
    const interval = setInterval(() => forceUpdate((v) => v + 1), 2000);
    return () => clearInterval(interval);
  }, [hasTypers]);

  const activeTypers = useMemo(() => {
    if (!channelTyping) return [];
    const now = Date.now();
    return Array.from(channelTyping.entries())
      .filter(([userId, ts]) => userId !== currentUserId && now - ts < 10000)
      .map(([userId]) => userId);
  }, [channelTyping, currentUserId, tick]);

  if (activeTypers.length === 0) return null;

  const text =
    activeTypers.length === 1
      ? "Someone is typing"
      : activeTypers.length <= 3
        ? `${activeTypers.length} people are typing`
        : "Several people are typing";

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-text-muted">
      <div className="flex gap-0.5">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
      </div>
      <span>{text}...</span>
    </div>
  );
}
