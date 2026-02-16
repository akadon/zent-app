"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BarChart3, Check } from "lucide-react";
import type { Poll } from "@yxc/types";

interface PollDisplayProps {
  poll: Poll;
  channelId: string;
}

export function PollDisplay({ poll: initialPoll, channelId }: PollDisplayProps) {
  const [poll, setPoll] = useState(initialPoll);
  const [voting, setVoting] = useState(false);

  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;
  const hasVoted = poll.options.some((o) => o.voted);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);

  const handleVote = async (optionId: string) => {
    if (voting || isExpired) return;
    setVoting(true);
    try {
      const option = poll.options.find((o) => o.id === optionId);
      if (option?.voted) {
        await api.delete(`/channels/${channelId}/polls/${poll.id}/votes/${optionId}`);
      } else {
        await api.put(`/channels/${channelId}/polls/${poll.id}/votes/${optionId}`);
      }
      // Refresh poll data
      const updated = await api.get<Poll>(`/channels/${channelId}/polls/${poll.id}`);
      setPoll(updated);
    } catch {
      // silently fail
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mt-2 max-w-md rounded-lg border border-background-tertiary bg-background-secondary p-4">
      {/* Question */}
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 size={16} className="text-brand" />
        <h4 className="text-sm font-semibold text-header-primary">{poll.question}</h4>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={voting || isExpired}
              className={cn(
                "relative w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                option.voted
                  ? "border-brand bg-brand/10"
                  : "border-background-tertiary bg-background-primary hover:border-interactive-hover",
                (voting || isExpired) && "cursor-default opacity-70"
              )}
            >
              {/* Progress bar background */}
              {(hasVoted || isExpired) && (
                <div
                  className="absolute inset-0 rounded-md bg-brand/10 transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {option.voted && <Check size={14} className="text-brand" />}
                  {option.text}
                </span>
                {(hasVoted || isExpired) && (
                  <span className="text-xs text-text-muted">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}</span>
        {poll.expiresAt && (
          <span>
            {isExpired ? "Poll ended" : `Ends ${new Date(poll.expiresAt).toLocaleDateString()}`}
          </span>
        )}
        {poll.allowMultiselect && <span>Multiple choice</span>}
      </div>
    </div>
  );
}
