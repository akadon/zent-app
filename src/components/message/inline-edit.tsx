"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

interface InlineEditProps {
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

export function InlineEdit({ content, onSave, onCancel }: InlineEditProps) {
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && value.trim() !== content) {
        onSave(value.trim());
      } else {
        onCancel();
      }
    }
  };

  return (
    <div className="mt-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full resize-none rounded bg-background-tertiary px-3 py-2 text-sm text-text-normal outline-none focus:ring-1 focus:ring-brand"
        rows={1}
      />
      <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
        <span>escape to</span>
        <button onClick={onCancel} className="text-text-link hover:underline">cancel</button>
        <span>• enter to</span>
        <button
          onClick={() => {
            if (value.trim() && value.trim() !== content) onSave(value.trim());
            else onCancel();
          }}
          className="text-text-link hover:underline"
        >
          save
        </button>
      </div>
    </div>
  );
}
