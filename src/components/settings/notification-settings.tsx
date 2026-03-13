import { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { NotificationSettings } from "@yxc/types";

interface NotificationSettingsUIProps {
  guildId: string;
  channelId?: string;
}

export function NotificationSettingsUI({ guildId, channelId }: NotificationSettingsUIProps) {
  const [settings, setSettings] = useState<Partial<NotificationSettings>>({
    level: "all",
    suppressEveryone: false,
    suppressRoles: false,
    muted: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (guildId) params.set("guildId", guildId);
    if (channelId) params.set("channelId", channelId);
    api
      .get<NotificationSettings>(`/users/@me/notification-settings?${params}`)
      .then(setSettings)
      .catch(() => toast.error("Failed to load notification settings"));
  }, [guildId, channelId]);

  const save = async (updates: Partial<NotificationSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    setSaving(true);
    try {
      await api.put("/users/@me/notification-settings", {
        guildId,
        channelId: channelId ?? null,
        ...next,
      });
    } catch {
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase text-text-muted">
        {channelId ? "Channel" : "Server"} Notifications
      </h3>

      {/* Mute toggle */}
      <label className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {settings.muted ? <BellOff size={18} className="text-text-muted" /> : <Bell size={18} className="text-text-normal" />}
          <span className="text-sm text-text-normal">Mute</span>
        </div>
        <button
          onClick={() => save({ muted: !settings.muted })}
          className={`relative h-5 w-9 rounded-full transition-colors ${settings.muted ? "bg-brand" : "bg-background-tertiary"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${settings.muted ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </button>
      </label>

      {/* Notification level */}
      <div>
        <p className="mb-2 text-xs text-text-muted">Notification Frequency</p>
        <div className="space-y-1">
          {(["all", "mentions", "none"] as const).map((level) => (
            <button
              key={level}
              onClick={() => save({ level })}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${
                settings.level === level
                  ? "bg-brand/20 text-brand"
                  : "text-text-normal hover:bg-background-primary"
              }`}
            >
              {level === "all" && <Volume2 size={16} />}
              {level === "mentions" && <Bell size={16} />}
              {level === "none" && <VolumeX size={16} />}
              {level === "all" ? "All Messages" : level === "mentions" ? "Only @mentions" : "Nothing"}
            </button>
          ))}
        </div>
      </div>

      {/* Suppress options */}
      <div className="space-y-2">
        <label className="flex items-center justify-between">
          <span className="text-sm text-text-normal">Suppress @everyone and @here</span>
          <button
            onClick={() => save({ suppressEveryone: !settings.suppressEveryone })}
            className={`relative h-5 w-9 rounded-full transition-colors ${settings.suppressEveryone ? "bg-brand" : "bg-background-tertiary"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${settings.suppressEveryone ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-text-normal">Suppress role @mentions</span>
          <button
            onClick={() => save({ suppressRoles: !settings.suppressRoles })}
            className={`relative h-5 w-9 rounded-full transition-colors ${settings.suppressRoles ? "bg-brand" : "bg-background-tertiary"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${settings.suppressRoles ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
        </label>
      </div>

      {saving && <p className="text-xs text-text-muted">Saving...</p>}
    </div>
  );
}
