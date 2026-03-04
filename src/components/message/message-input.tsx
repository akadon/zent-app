import { useState, useRef, useEffect, useCallback, Suspense, lazy } from "react";
import { PlusCircle, Smile, X, Paperclip, BarChart3 } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
const LazyEmojiPicker = lazy(() => import("./emoji-picker").then(m => ({ default: m.EmojiPicker })));
import { ReplyPreview } from "./reply-preview";
import type { Message } from "@yxc/types";

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
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollMultiselect, setPollMultiselect] = useState(false);
  const [pollDuration, setPollDuration] = useState("");
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
    } catch {}
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
          title="Upload file"
        >
          <PlusCircle size={24} />
        </button>
        <button
          onClick={() => setShowPollCreator(!showPollCreator)}
          className="shrink-0 p-3 text-interactive-normal hover:text-interactive-hover"
          title="Create poll"
        >
          <BarChart3 size={20} />
        </button>

        <textarea
          ref={textareaRef}
          aria-label="Message"
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
