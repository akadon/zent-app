"use client";

import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import type { Message, Reaction } from "@yxc/types";
import { cn } from "@/lib/utils";
import { MessageContent } from "./message-content";
import { PollDisplay } from "./poll-display";
import { MessageActions } from "./message-actions";
import { ImageLightbox } from "./image-lightbox";
import { InlineEdit } from "./inline-edit";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Reply, FileText, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface MessageItemProps {
  message: Message;
  isCompact: boolean;
  onReply?: (message: Message) => void;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
  return format(date, "MM/dd/yyyy h:mm a");
}

function formatCompactTime(dateStr: string): string {
  return format(new Date(dateStr), "h:mm a");
}

// Generate consistent gradient from user ID - using Zent color palette
function getUserGradient(userId: string): string {
  const gradients = [
    "from-brand to-brand-dark",           // Mint
    "from-accent-cyan to-accent-blue",    // Cyan to Blue
    "from-accent-blue to-accent-purple",  // Blue to Purple
    "from-accent-purple to-accent-pink",  // Purple to Pink
    "from-accent-pink to-accent-orange",  // Pink to Orange
    "from-accent-orange to-yellow",       // Orange to Yellow
    "from-green to-brand",                // Green to Mint
    "from-accent-cyan to-brand-light",    // Cyan to Mint Light
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length]!;
}

// Generate consistent color from user ID for username - using Zent accent palette
function getUserColor(userId: string): string {
  const colors = [
    "#00f5c4", // brand-light (mint)
    "#22d3ee", // accent-cyan
    "#38bdf8", // accent-blue
    "#c084fc", // accent-purple
    "#f472b6", // accent-pink
    "#fb923c", // accent-orange
    "#fbbf24", // yellow
    "#00d4aa", // brand (mint darker)
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

export function MessageItem({ message, isCompact, onReply }: MessageItemProps) {
  const userColor = getUserColor(message.author.id);
  const userGradient = getUserGradient(message.author.id);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuthStore();
  const isOwn = user?.id === message.author.id;
  const queryClient = useQueryClient();

  const handleReactionToggle = async (reaction: Reaction) => {
    try {
      const emojiKey = encodeURIComponent(reaction.emoji.name);
      if (reaction.me) {
        await api.delete(`/channels/${message.channelId}/messages/${message.id}/reactions/${emojiKey}/@me`);
      } else {
        await api.put(`/channels/${message.channelId}/messages/${message.id}/reactions/${emojiKey}/@me`);
      }
      queryClient.invalidateQueries({ queryKey: ["messages", message.channelId] });
    } catch {}
  };

  if (isCompact) {
    return (
      <div
        className={cn(
          "group relative flex items-start px-4 py-0.5",
          "transition-colors duration-150",
          isHovered && "bg-background-hover/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Message actions */}
        <div className={cn(
          "absolute -top-3 right-4 z-10",
          "transition-all duration-150",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        )}>
          <MessageActions
            message={message}
            channelId={message.channelId}
            onReply={onReply ? () => onReply(message) : undefined}
            onEdit={isOwn ? () => setEditing(true) : undefined}
          />
        </div>

        {/* Timestamp on hover */}
        <span className={cn(
          "mr-4 w-10 shrink-0 pt-0.5 text-right text-[11px] text-text-muted",
          "transition-opacity duration-150",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          {formatCompactTime(message.createdAt)}
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="animate-fade-in">
              <InlineEdit
                content={message.content}
                onSave={(content) => {
                  api.patch(`/channels/${message.channelId}/messages/${message.id}`, { content });
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <MessageContent content={message.content} />
          )}
          {message.poll && <PollDisplay poll={message.poll} channelId={message.channelId} />}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji.name}
                  onClick={() => handleReactionToggle(reaction)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                    "border transition-colors duration-150",
                    reaction.me
                      ? "border-brand/50 bg-brand/10 text-brand-light"
                      : "border-background-tertiary bg-background-secondary text-text-muted hover:bg-background-hover"
                  )}
                >
                  <span>{reaction.emoji.name}</span>
                  <span className="font-medium">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative mt-4 flex items-start px-4 py-1",
        "transition-colors duration-150",
        isHovered && "bg-background-hover/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Message actions toolbar */}
      <div className={cn(
        "absolute -top-3 right-4 z-10",
        "transition-all duration-200 ease-smooth",
        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        <MessageActions
          message={message}
          channelId={message.channelId}
          onReply={onReply ? () => onReply(message) : undefined}
          onEdit={isOwn ? () => setEditing(true) : undefined}
        />
      </div>

      {/* Avatar */}
      <div className="mr-4 mt-0.5 shrink-0">
        {message.author.avatar ? (
          <img
            src={message.author.avatar}
            alt=""
            className={cn(
              "h-10 w-10 rounded-full object-cover",
              "ring-2 ring-transparent transition-all duration-200",
              "hover:ring-brand/30 hover:scale-105"
            )}
          />
        ) : (
          <div
            className={cn(
              "avatar avatar-md bg-gradient-to-br",
              userGradient,
              "transition-transform duration-200 hover:scale-105"
            )}
          >
            {(message.author.displayName ?? message.author.username)?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <span
            className="cursor-pointer text-sm font-semibold transition-colors duration-150 hover:underline"
            style={{ color: userColor }}
          >
            {message.author.displayName ?? message.author.username}
          </span>
          <span className="text-xs text-text-muted">
            {formatTimestamp(message.createdAt)}
          </span>
          {message.editedTimestamp && (
            <span className="text-2xs text-text-muted opacity-70">(edited)</span>
          )}
        </div>

        {/* Reply reference */}
        {message.referencedMessage && (
          <div className={cn(
            "mt-1 mb-1 flex items-center gap-2 text-xs text-text-muted",
            "animate-fade-in"
          )}>
            <Reply size={12} className="shrink-0 rotate-180" />
            <div
              className="h-4 w-0.5 rounded-full"
              style={{ backgroundColor: getUserColor(message.referencedMessage.author.id) }}
            />
            <span
              className="font-medium cursor-pointer hover:underline"
              style={{ color: getUserColor(message.referencedMessage.author.id) }}
            >
              {message.referencedMessage.author.username}
            </span>
            <span className="truncate max-w-xs opacity-80">
              {message.referencedMessage.content}
            </span>
          </div>
        )}

        {/* Message content */}
        {editing ? (
          <div className="animate-fade-in">
            <InlineEdit
              content={message.content}
              onSave={(content) => {
                api.patch(`/channels/${message.channelId}/messages/${message.id}`, { content });
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <MessageContent content={message.content} />
        )}

        {/* Poll */}
        {message.poll && (
          <div className="mt-2 animate-fade-in-up">
            <PollDisplay poll={message.poll} channelId={message.channelId} />
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att, index) => (
              <div
                key={att.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
              >
                {att.contentType?.startsWith("image/") ? (
                  <div className="group/img relative overflow-hidden rounded-xl">
                    <img
                      src={att.url}
                      alt={att.filename}
                      className={cn(
                        "max-h-[300px] max-w-[400px] cursor-pointer rounded-xl object-contain",
                        "transition-all duration-300",
                        "hover:brightness-110"
                      )}
                      onClick={() => setLightboxImage({ src: att.url, alt: att.filename })}
                    />
                    {/* Image overlay on hover */}
                    <div className={cn(
                      "absolute inset-0 flex items-end justify-end p-2",
                      "bg-gradient-to-t from-black/50 to-transparent",
                      "opacity-0 transition-opacity duration-200",
                      "group-hover/img:opacity-100"
                    )}>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3",
                      "bg-surface border border-surface-border",
                      "transition-all duration-200",
                      "hover:bg-surface-light hover:border-brand/30"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                      <FileText size={20} className="text-brand-light" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-header-primary">
                        {att.filename}
                      </p>
                      <p className="text-xs text-text-muted">
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Download size={16} className="shrink-0 text-text-muted" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji.name}
                onClick={() => handleReactionToggle(reaction)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                  "border transition-colors duration-150",
                  reaction.me
                    ? "border-brand/50 bg-brand/10 text-brand-light"
                    : "border-background-tertiary bg-background-secondary text-text-muted hover:bg-background-hover"
                )}
              >
                <span>{reaction.emoji.name}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
