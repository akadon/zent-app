import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { X, LogOut, User, Shield, Paintbrush, Bell, Download, Key, Monitor, Eye } from "lucide-react";
import { ThemeEditor } from "./theme-editor";
import { NotificationSettingsUI } from "./notification-settings";
import { MFASettings } from "./mfa-settings";
import { SessionManagement } from "./session-management";
import { AccessibilitySettings } from "./accessibility-settings";
import { PushNotificationSettings } from "./push-notification-settings";
import { EmailVerification } from "./email-verification";
import { PasskeySettings } from "./passkey-settings";
import { RecoveryKeySettings } from "./recovery-key-settings";

type SettingsTab = "account" | "profile" | "security" | "sessions" | "appearance" | "accessibility" | "notifications" | "data";

export function UserSettings() {
  const closeModal = useUIStore((s) => s.closeModal);
  const { user, logout, loadSession } = useAuthStore();
  const [tab, setTab] = useState<SettingsTab>("account");

  return (
    <div className="fixed inset-0 z-50 flex bg-background-tertiary">
      {/* Sidebar */}
      <div className="flex w-[218px] flex-col items-end bg-background-secondary pt-16 pr-2">
        <div className="w-[192px]">
          <p className="mb-1 px-2.5 text-xs font-bold uppercase text-channel-default">
            User Settings
          </p>
          <SettingsNavItem
            label="My Account"
            icon={<User size={18} />}
            active={tab === "account"}
            onClick={() => setTab("account")}
          />
          <SettingsNavItem
            label="Profile"
            icon={<Shield size={18} />}
            active={tab === "profile"}
            onClick={() => setTab("profile")}
          />
          <SettingsNavItem
            label="Security"
            icon={<Key size={18} />}
            active={tab === "security"}
            onClick={() => setTab("security")}
          />
          <SettingsNavItem
            label="Sessions"
            icon={<Monitor size={18} />}
            active={tab === "sessions"}
            onClick={() => setTab("sessions")}
          />
          <SettingsNavItem
            label="Appearance"
            icon={<Paintbrush size={18} />}
            active={tab === "appearance"}
            onClick={() => setTab("appearance")}
          />
          <SettingsNavItem
            label="Accessibility"
            icon={<Eye size={18} />}
            active={tab === "accessibility"}
            onClick={() => setTab("accessibility")}
          />
          <SettingsNavItem
            label="Notifications"
            icon={<Bell size={18} />}
            active={tab === "notifications"}
            onClick={() => setTab("notifications")}
          />
          <SettingsNavItem
            label="Data & Privacy"
            icon={<Download size={18} />}
            active={tab === "data"}
            onClick={() => setTab("data")}
          />

          <div className="my-2 h-px bg-background-primary" />

          <button
            onClick={() => {
              logout();
              closeModal();
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-sm text-red hover:bg-interactive-muted/20"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-10 pt-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-header-primary">
            {tab === "account" && "My Account"}
            {tab === "profile" && "Profile"}
            {tab === "security" && "Security"}
            {tab === "sessions" && "Active Sessions"}
            {tab === "appearance" && "Appearance"}
            {tab === "accessibility" && "Accessibility"}
            {tab === "notifications" && "Notifications"}
            {tab === "data" && "Data & Privacy"}
          </h1>
          <button
            onClick={closeModal}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-interactive-muted text-interactive-normal hover:border-interactive-hover hover:text-interactive-hover"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-w-[660px]">
          {tab === "account" && <AccountTab />}
          {tab === "profile" && <ProfileTab />}
          {tab === "security" && (
            <div className="space-y-6">
              <EmailVerification />
              <MFASettings />
              <PasskeySettings />
              <RecoveryKeySettings />
            </div>
          )}
          {tab === "sessions" && <SessionManagement />}
          {tab === "appearance" && <AppearanceTab />}
          {tab === "accessibility" && <AccessibilitySettings />}
          {tab === "notifications" && <UserNotificationsTab />}
          {tab === "data" && <DataPrivacyTab />}
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-sm ${
        active
          ? "bg-interactive-muted/30 text-interactive-active"
          : "text-interactive-normal hover:bg-interactive-muted/20 hover:text-interactive-hover"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AccountTab() {
  const { user } = useAuthStore();

  return (
    <div className="rounded-lg bg-background-secondary p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-header-primary">
            {user?.displayName ?? user?.username}
          </h3>
          <p className="text-sm text-text-muted">{user?.username}</p>
          {/* email is optional on User type — only included for @me requests */}
          <p className="text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, loadSession } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const updateProfile = useMutation({
    mutationFn: (data: { displayName?: string | null; bio?: string | null }) =>
      api.patch("/users/@me", data),
    onSuccess: () => {
      loadSession();
      toast.success("Profile updated");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to update profile");
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={32}
          className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
          About Me
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={190}
          rows={4}
          className="w-full resize-none rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
        />
        <p className="mt-1 text-xs text-text-muted">{bio.length}/190</p>
      </div>

      <button
        onClick={() =>
          updateProfile.mutate({
            displayName: displayName || null,
            bio: bio || null,
          })
        }
        disabled={updateProfile.isPending}
        className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {updateProfile.isPending ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function AppearanceTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-background-secondary p-4">
        <h3 className="mb-4 text-sm font-bold uppercase text-header-secondary">
          Theme
        </h3>
        <ThemeEditor />
      </div>
    </div>
  );
}

const NOTIF_STORAGE_KEY = "notification-settings";

interface NotifSettings {
  desktopNotifications: boolean;
  notificationSounds: boolean;
  unreadBadge: boolean;
}

const DEFAULT_NOTIF: NotifSettings = {
  desktopNotifications: true,
  notificationSounds: true,
  unreadBadge: true,
};

function UserNotificationsTab() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_NOTIF);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_NOTIF, ...JSON.parse(stored) });
    } catch {
      // ignore
    }
  }, []);

  const toggle = (key: keyof NotifSettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-background-secondary p-4">
        <h3 className="mb-4 text-sm font-bold uppercase text-header-secondary">
          Desktop Notifications
        </h3>
        <p className="text-sm text-text-muted mb-3">
          Configure how you receive notifications across all servers.
        </p>
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-normal">Enable Desktop Notifications</span>
            <input
              type="checkbox"
              checked={settings.desktopNotifications}
              onChange={() => toggle("desktopNotifications")}
              className="h-4 w-4 accent-brand"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-normal">Enable Notification Sounds</span>
            <input
              type="checkbox"
              checked={settings.notificationSounds}
              onChange={() => toggle("notificationSounds")}
              className="h-4 w-4 accent-brand"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-text-normal">Enable Unread Badge</span>
            <input
              type="checkbox"
              checked={settings.unreadBadge}
              onChange={() => toggle("unreadBadge")}
              className="h-4 w-4 accent-brand"
            />
          </label>
        </div>
      </div>
      <PushNotificationSettings />
    </div>
  );
}

function DataPrivacyTab() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.get<any>("/users/@me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zent-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-background-secondary p-4">
        <h3 className="mb-2 text-sm font-bold uppercase text-header-secondary">
          Request Your Data
        </h3>
        <p className="mb-3 text-sm text-text-muted">
          Download a copy of your data including your account info, messages, and relationships.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? "Exporting..." : "Export My Data"}
        </button>
      </div>

      <div className="rounded-lg border border-red/30 bg-background-secondary p-4">
        <h3 className="mb-2 text-sm font-bold uppercase text-red">
          Delete Account
        </h3>
        <p className="mb-3 text-sm text-text-muted">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          className="rounded-[3px] bg-red px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
          disabled
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
