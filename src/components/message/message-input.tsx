import { useState, useRef, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import { PlusCircle, Smile, X, Paperclip, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { api, API_URL } from "@/lib/api";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { useGuildStore } from "@/stores/guild";
import { cn } from "@/lib/utils";
const LazyEmojiPicker = lazy(() => import("./emoji-picker").then(m => ({ default: m.EmojiPicker })));
import { ReplyPreview } from "./reply-preview";
import type { Message } from "@yxc/types";

interface MessageInputProps {
  channelId: string;
  channelName?: string;
  guildId?: string;
  onSend: (content: string, replyTo?: string) => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

interface PendingFile {
  file: File;
  preview: string | null;
}

export function MessageInput({ channelId, channelName, guildId, onSend, disabled, replyingTo, onCancelReply }: MessageInputProps) {
  const { draft, saveDraft, clearDraft } = useDraftPersistence(channelId);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollMultiselect, setPollMultiselect] = useState(false);
  const [pollDuration, setPollDuration] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);

  // Get guild members for @mention autocomplete
  const members = useGuildStore((s) => guildId ? s.members.get(guildId) ?? [] : []);
  const filteredMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => {
        const name = (m.user as any)?.displayName ?? (m.user as any)?.username ?? "";
        return name.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [members, mentionQuery]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  }, [content]);

  // Load draft on channel change
  useEffect(() => {
    setContent(draft);
    setFiles([]);
  }, [channelId, draft]);

  // Revoke all pending object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setFiles((prev) => {
        for (const f of prev) {
          if (f.preview) URL.revokeObjectURL(f.preview);
        }
        return prev;
      });
    };
  }, []);

  // Send typing indicator (debounced to every 5s)
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current > 5000) {
      lastTypingRef.current = now;
      api.post(`/channels/${channelId}/typing`).catch(() => {});
    }
  }, [channelId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const pending: PendingFile[] = [];
    for (const file of Array.from(selected)) {
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
      pending.push({ file, preview });
    }
    setFiles((prev) => [...prev, ...pending]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      if (next[index]?.preview) URL.revokeObjectURL(next[index]!.preview!);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSend = async () => {
    if (disabled || uploading) return;
    if (!content.trim() && files.length === 0) return;

    if (files.length > 0) {
      setUploading(true);
      try {
        const formData = new FormData();
        if (content.trim()) formData.append("content", content.trim());
        for (const f of files) {
          formData.append("files", f.file);
        }
        if (replyingTo) {
          formData.append("message_reference", JSON.stringify({ message_id: replyingTo.id }));
        }

        const token = api.getToken();
        await fetch(`${API_URL}/channels/${channelId}/messages/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        setContent("");
        clearDraft();
        setFiles([]);
        onCancelReply?.();
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to upload file");
      } finally {
        setUploading(false);
      }
    } else {
      onSend(content.trim(), replyingTo?.id);
      setContent("");
      clearDraft();
      onCancelReply?.();
    }
  };

  const insertMention = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const before = content.slice(0, cursor);
    const atIndex = before.lastIndexOf("@");
    if (atIndex === -1) return;
    const after = content.slice(cursor);
    const newContent = before.slice(0, atIndex) + `@${username} ` + after;
    setContent(newContent);
    saveDraft(newContent);
    setMentionQuery(null);
    setMentionIndex(0);
    // Restore focus after React re-render
    requestAnimationFrame(() => {
      const pos = atIndex + username.length + 2;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention autocomplete navigation
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        const member = filteredMembers[mentionIndex];
        if (member) {
          const username = (member.user as any)?.username ?? "";
          insertMention(username);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePollSubmit = async () => {
    const validOptions = pollOptions.filter((o) => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) return;
    try {
      await api.post(`/channels/${channelId}/polls`, {
        question: pollQuestion.trim(),
        options: validOptions.map((text) => text.trim()),
        allowMultiselect: pollMultiselect,
        ...(pollDuration ? { duration: parseInt(pollDuration, 10) * 3600 } : {}),
      });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollMultiselect(false);
      setPollDuration("");
      setShowPollCreator(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create poll");
    }
  };

  return (
    <div className="px-4 pb-6">
      {/* Reply preview */}
      {replyingTo && (
        <ReplyPreview message={replyingTo} onCancel={() => onCancelReply?.()} />
      )}

      {/* Poll creator */}
      {showPollCreator && (
        <div className="mb-2 rounded-lg border border-surface-border bg-background-secondary/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-header-primary">
              <BarChart3 size={16} className="text-brand" />
              Create Poll
            </div>
            <button
              onClick={() => setShowPollCreator(false)}
              className="p-1 rounded text-text-muted hover:text-text-normal"
            >
              <X size={14} />
            </button>
          </div>
          <input
            aria-label="Poll question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full rounded-md bg-background-tertiary px-3 py-1.5 text-sm text-text-normal placeholder-text-muted outline-none focus:ring-1 focus:ring-brand/30"
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
                aria-label={`Poll option ${i + 1}`}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-md bg-background-tertiary px-3 py-1.5 text-sm text-text-normal placeholder-text-muted outline-none focus:ring-1 focus:ring-brand/30"
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}
                  className="p-1 rounded text-text-muted hover:text-status-danger"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 4 && (
            <button
              onClick={() => setPollOptions((prev) => [...prev, ""])}
              className="text-xs text-brand-light hover:underline"
            >
              + Add option
            </button>
          )}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pollMultiselect}
                onChange={(e) => setPollMultiselect(e.target.checked)}
                className="accent-brand"
              />
              Multiple choice
            </label>
            <label className="flex items-center gap-1.5">
              Expires in
              <input
                type="number"
                min="1"
                value={pollDuration}
                onChange={(e) => setPollDuration(e.target.value)}
                placeholder="hours"
                className="w-16 rounded bg-background-tertiary px-2 py-0.5 text-text-normal outline-none"
              />
              h
            </label>
          </div>
          <button
            onClick={handlePollSubmit}
            disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Poll
          </button>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto rounded-t-lg bg-background-secondary/70 p-3">
          {files.map((f, i) => (
            <div
              key={i}
              className="group relative shrink-0 rounded bg-background-tertiary p-2"
            >
              <button
                onClick={() => removeFile(i)}
                className="absolute -right-1 -top-1 hidden rounded-full bg-red p-0.5 text-white group-hover:block"
              >
                <X size={12} />
              </button>
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="h-20 w-20 rounded object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center">
                  <Paperclip size={24} className="text-text-muted" />
                </div>
              )}
              <p className="mt-1 max-w-[80px] truncate text-xs text-text-muted">
                {f.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* @mention autocomplete */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="mb-1 rounded-lg border border-surface-border bg-background-secondary shadow-lg overflow-hidden">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-text-muted">
            Members matching @{mentionQuery}
          </div>
          {filteredMembers.map((member, i) => {
            const user = member.user as any;
            const username = user?.username ?? "";
            const displayName = user?.displayName ?? username;
            return (
              <button
                key={user?.id ?? i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(username);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm",
                  i === mentionIndex
                    ? "bg-brand/15 text-brand-light"
                    : "text-text-normal hover:bg-background-hover/50"
                )}
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-xs font-bold text-white">
                  {displayName[0]?.toUpperCase()}
                </div>
                <span className="font-medium">{displayName}</span>
                {displayName !== username && (
                  <span className="text-xs text-text-muted">@{username}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-0 rounded-lg bg-background-secondary/70">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.txt,.zip,.json"
        />
        <button
          data-testid="file-upload-button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-3 text-interactive-normal hover:text-interactive-hover"
          title="Upload file"
        >
          <PlusCircle size={24} />
        </button>
        <button
          data-testid="poll-create-button"
          onClick={() => setShowPollCreator(!showPollCreator)}
          className="shrink-0 p-3 text-interactive-normal hover:text-interactive-hover"
          title="Create poll"
        >
          <BarChart3 size={20} />
        </button>

        <textarea
          ref={textareaRef}
          data-testid="message-input"
          aria-label="Message"
          value={content}
          onChange={(e) => {
            const val = e.target.value;
            setContent(val);
            saveDraft(val);
            if (val) sendTyping();
            // Detect @mention typing
            const cursor = e.target.selectionStart;
            const before = val.slice(0, cursor);
            const atMatch = before.match(/@(\w*)$/);
            if (atMatch) {
              setMentionQuery(atMatch[1]!);
              setMentionIndex(0);
            } else {
              setMentionQuery(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={channelName ? `Message #${channelName}` : "Message"}
          rows={1}
          className="max-h-[300px] flex-1 resize-none bg-transparent py-3 text-sm text-text-normal placeholder-text-muted outline-none"
        />

        <div className="relative flex shrink-0 gap-1 p-2">
          <button
            data-testid="emoji-picker-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded p-1 text-interactive-normal hover:text-interactive-hover"
          >
            <Smile size={22} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <Suspense fallback={<div className="h-[350px] w-[350px] rounded-lg bg-background-secondary" />}>
                <LazyEmojiPicker
                  onSelect={(emoji) => {
                    setContent((prev) => {
                      const updated = prev + emoji;
                      saveDraft(updated);
                      return updated;
                    });
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
