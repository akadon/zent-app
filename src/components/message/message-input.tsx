"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PlusCircle, Smile, X, Paperclip } from "lucide-react";
import { api } from "@/lib/api";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { EmojiPicker } from "./emoji-picker";
import { ReplyPreview } from "./reply-preview";
import type { Message } from "@yxc/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface MessageInputProps {
  channelId: string;
  onSend: (content: string, replyTo?: string) => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

interface PendingFile {
  file: File;
  preview: string | null;
}

export function MessageInput({ channelId, onSend, disabled, replyingTo, onCancelReply }: MessageInputProps) {
  const { draft, saveDraft, clearDraft } = useDraftPersistence(channelId);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);

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

        const token = api.getToken();
        await fetch(`${API_URL}/channels/${channelId}/messages/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        setContent("");
        clearDraft();
        setFiles([]);
      } catch {
        // Error handled silently
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-6">
      {/* Reply preview */}
      {replyingTo && (
        <ReplyPreview message={replyingTo} onCancel={() => onCancelReply?.()} />
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
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-3 text-interactive-normal hover:text-interactive-hover"
        >
          <PlusCircle size={24} />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            saveDraft(e.target.value);
            if (e.target.value) sendTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message #channel"
          rows={1}
          className="max-h-[300px] flex-1 resize-none bg-transparent py-3 text-sm text-text-normal placeholder-text-muted outline-none"
        />

        <div className="relative flex shrink-0 gap-1 p-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded p-1 text-interactive-normal hover:text-interactive-hover"
          >
            <Smile size={22} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker
                onSelect={(emoji) => {
                  setContent((prev) => prev + emoji);
                  saveDraft(content + emoji);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
