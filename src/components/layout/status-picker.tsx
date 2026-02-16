"use client";

import { useState, useRef, useEffect } from "react";
import { gateway } from "@/gateway/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STATUSES = [
  { value: "online", label: "Online", color: "bg-status-online", description: "Show as online" },
  { value: "idle", label: "Idle", color: "bg-status-idle", description: "Show as away" },
  { value: "dnd", label: "Do Not Disturb", color: "bg-status-dnd", description: "Suppress notifications" },
  { value: "offline", label: "Invisible", color: "bg-status-offline", description: "Appear offline" },
] as const;

interface StatusPickerProps {
  children?: React.ReactNode;
}

export function StatusPicker({ children }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("online");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (status: string) => {
    setCurrentStatus(status);
    gateway.updatePresence(status as "online" | "idle" | "dnd" | "invisible");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {children}
      </div>

      {/* Dropdown menu */}
      <div
        className={cn(
          "absolute bottom-full left-0 z-50 mb-2 w-56",
          "rounded-xl border border-surface-border bg-background-floating",
          "shadow-elevated p-2",
          "transition-all duration-200 ease-smooth origin-bottom-left",
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        )}
      >
        {/* Header */}
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Set Status
        </p>

        {/* Status options */}
        <div className="space-y-1">
          {STATUSES.map((status, index) => (
            <button
              key={status.value}
              onClick={() => handleSelect(status.value)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                "transition-all duration-150",
                currentStatus === status.value
                  ? "bg-brand/10"
                  : "hover:bg-background-hover"
              )}
              style={{
                animationDelay: open ? `${index * 30}ms` : "0ms",
              }}
            >
              {/* Status indicator */}
              <div className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full transition-transform duration-200",
                    status.color,
                    currentStatus === status.value && "scale-110"
                  )}
                />
                {currentStatus === status.value && (
                  <div className={cn(
                    "absolute inset-0 rounded-full animate-ping opacity-30",
                    status.color
                  )} />
                )}
              </div>

              {/* Label and description */}
              <div className="flex-1 text-left">
                <p className={cn(
                  "text-sm font-medium transition-colors duration-150",
                  currentStatus === status.value
                    ? "text-brand-light"
                    : "text-text-normal group-hover:text-header-primary"
                )}>
                  {status.label}
                </p>
                <p className="text-xs text-text-muted">
                  {status.description}
                </p>
              </div>

              {/* Check mark for selected */}
              <div
                className={cn(
                  "transition-all duration-200",
                  currentStatus === status.value
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-75"
                )}
              >
                <Check size={16} className="text-brand-light" />
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-2 h-px bg-surface-border" />

        {/* Custom status (placeholder) */}
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-background-hover transition-colors duration-150">
          <span className="text-lg">💭</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-normal">
              Set Custom Status
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
