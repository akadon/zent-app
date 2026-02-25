import { X } from "lucide-react";
import type { Message } from "@yxc/types";

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

export function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  return (
    <div className="mx-4 flex items-center gap-2 rounded-t-lg bg-background-secondary/70 px-3 py-2">
      <div className="h-full w-1 rounded-full bg-brand" />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-brand">
          Replying to {message.author.displayName ?? message.author.username}
        </span>
        <p className="truncate text-xs text-text-muted">{message.content}</p>
      </div>
      <button
        onClick={onCancel}
        className="shrink-0 rounded p-0.5 text-text-muted hover:bg-background-primary hover:text-text-normal"
      >
        <X size={16} />
      </button>
    </div>
  );
}
