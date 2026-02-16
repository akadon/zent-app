"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Notification } from "@yxc/types";
import { format } from "date-fns";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.get<Notification[]>("/users/@me/notifications?limit=20");
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/users/@me/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await api.delete("/users/@me/notifications");
      setNotifications([]);
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative rounded p-1.5 text-interactive-normal hover:text-interactive-hover"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-background-tertiary bg-background-secondary shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-background-tertiary px-4 py-3">
            <h3 className="text-sm font-semibold text-header-primary">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={markAllRead}
                className="text-xs text-text-muted hover:text-text-normal"
                title="Mark all as read"
              >
                <Check size={14} />
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-text-muted hover:text-text-normal"
                title="Clear all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No notifications
              </div>
            )}
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "border-b border-background-tertiary/50 px-4 py-3",
                  !notif.read && "bg-brand/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {!notif.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-normal">{notif.title}</p>
                    {notif.body && (
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{notif.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-text-muted">
                      {format(new Date(notif.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
