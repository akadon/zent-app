"use client";

import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "idle" | "dnd" | "offline" | "streaming";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusColors = {
  online: "bg-status-online",
  idle: "bg-status-idle",
  dnd: "bg-status-dnd",
  offline: "bg-status-offline",
  streaming: "bg-status-streaming",
};

const sizeClasses = {
  sm: "status-indicator-sm",
  md: "status-indicator-md",
  lg: "status-indicator-lg",
};

export function StatusIndicator({ status, size = "sm", className }: StatusIndicatorProps) {
  return (
    <div className={cn("status-indicator", sizeClasses[size], statusColors[status], className)} />
  );
}
