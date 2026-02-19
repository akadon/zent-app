"use client";

import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  className?: string;
}

export function ResizeHandle({ onMouseDown, onDoubleClick, className }: ResizeHandleProps) {
  return (
    <div
      className={cn("resize-handle", className)}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    />
  );
}
