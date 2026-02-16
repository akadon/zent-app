"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Globe, LogOut, Shield } from "lucide-react";

interface Session {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  ip: string;
  lastActive: string;
  location: string | null;
  isCurrent: boolean;
}

function parseUserAgent(ua: string): { device: string; deviceType: Session["deviceType"] } {
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);

  let browser = "Unknown Browser";
  if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";

  return {
    device: `${browser} on ${os}`,
    deviceType: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
  };
}

function DeviceIcon({ type }: { type: Session["deviceType"] }) {
  switch (type) {
    case "mobile":
      return <Smartphone className="h-5 w-5" />;
    case "desktop":
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
    const parsed = parseUserAgent(ua);

    setSessions([
      {
        id: "current",
        device: parsed.device,
        deviceType: parsed.deviceType,
        ip: "Current IP",
        lastActive: new Date().toISOString(),
        location: null,
        isCurrent: true,
      },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Active Sessions</h2>
      </div>

      <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
        Session management requires server-side session tracking. Currently showing only your
        active session.
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "flex items-center gap-4 rounded-md border p-4",
              session.isCurrent
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-zinc-700 bg-zinc-800"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                session.isCurrent
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-700 text-zinc-400"
              )}
            >
              <DeviceIcon type={session.deviceType} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-100 truncate">{session.device}</p>
                {session.isCurrent && (
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {session.ip}
                </span>
                <span>
                  Last active: {new Date(session.lastActive).toLocaleString()}
                </span>
                {session.location && <span>{session.location}</span>}
              </div>
            </div>

            {!session.isCurrent && (
              <button className="shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        disabled={sessions.length <= 1}
        className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Log Out All Other Sessions
      </button>
    </div>
  );
}
