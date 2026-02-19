"use client";

import { useState, useRef, useEffect } from "react";
import { Smile, Reply, Pin, MoreHorizontal, Trash2, Edit, Copy } from "lucide-react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { EmojiPicker } from "./emoji-picker";
import type { Message } from "@yxc/types";

interface MessageActionsProps {
  message: Message;
  channelId: string;
  onReply?: (message: Message) => void;
  onEdit?: () => void;
}

export function MessageActions({ message, channelId, onReply, onEdit }: MessageActionsProps) {
  const [showMore, setShowMore] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const queryClient = useQueryClient();
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmojiPicker]);

  const handlePin = async () => {
    try {
      if (message.pinned) {
        await api.delete(`/channels/${channelId}/pins/${message.id}`);
      } else {
        await api.put(`/channels/${channelId}/pins/${message.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
      queryClient.invalidateQueries({ queryKey: ["pins", channelId] });
    } catch {}
  };

  const handleReaction = async (emoji: string) => {
    try {
      await api.put(`/channels/${channelId}/messages/${message.id}/reactions/${encodeURIComponent(emoji)}/@me`);
      queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
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
      <div className="relative" ref={emojiPickerRef}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="rounded p-1.5 text-interactive-normal hover:bg-background-primary hover:text-interactive-hover"
          title="Add Reaction"
        >
          <Smile size={16} />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-50">
            <EmojiPicker
              onSelect={(emoji) => {
                handleReaction(emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
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
