"use client";

import { useState } from "react";
import { Smile, Reply, Pin, MoreHorizontal, Trash2, Edit, Copy } from "lucide-react";
import { api } from "@/lib/api";
import type { Message } from "@yxc/types";

interface MessageActionsProps {
  message: Message;
  channelId: string;
  onReply?: (message: Message) => void;
  onEdit?: () => void;
}

export function MessageActions({ message, channelId, onReply, onEdit }: MessageActionsProps) {
  const [showMore, setShowMore] = useState(false);

  const handlePin = async () => {
    try {
      await api.put(`/channels/${channelId}/pins/${message.id}`);
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/channels/${channelId}/messages/${message.id}`);
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className="absolute -top-4 right-4 z-10 flex items-center gap-0.5 rounded border border-background-tertiary bg-background-secondary p-0.5 shadow-lg">
      <button
        onClick={() => {}}
        className="rounded p-1.5 text-interactive-normal hover:bg-background-primary hover:text-interactive-hover"
        title="Add Reaction"
      >
        <Smile size={16} />
      </button>
      <button
        onClick={() => onReply?.(message)}
        className="rounded p-1.5 text-interactive-normal hover:bg-background-primary hover:text-interactive-hover"
        title="Reply"
      >
        <Reply size={16} />
      </button>
      <button
        onClick={handlePin}
        className="rounded p-1.5 text-interactive-normal hover:bg-background-primary hover:text-interactive-hover"
        title={message.pinned ? "Unpin" : "Pin"}
      >
        <Pin size={16} />
      </button>
      <div className="relative">
        <button
          onClick={() => setShowMore(!showMore)}
          className="rounded p-1.5 text-interactive-normal hover:bg-background-primary hover:text-interactive-hover"
          title="More"
        >
          <MoreHorizontal size={16} />
        </button>
        {showMore && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded border border-background-tertiary bg-background-floating p-1 shadow-xl">
            {onEdit && (
              <button
                onClick={() => { onEdit(); setShowMore(false); }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-interactive-normal hover:bg-brand hover:text-white"
              >
                <Edit size={14} />
                Edit Message
              </button>
            )}
            <button
              onClick={() => { handleCopy(); setShowMore(false); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-interactive-normal hover:bg-brand hover:text-white"
            >
              <Copy size={14} />
              Copy Text
            </button>
            <button
              onClick={() => { handleDelete(); setShowMore(false); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-status-danger hover:bg-status-danger hover:text-white"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
