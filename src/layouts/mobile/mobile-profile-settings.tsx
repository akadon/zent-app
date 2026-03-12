import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import { LogOut, Settings, User, Paintbrush, Key, Eye, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileProfileSettings() {
  const { user, logout, loadSession, isGuest } = useAuthStore();
  const openModal = useUIStore((s) => s.openModal);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [editingProfile, setEditingProfile] = useState(false);

  const updateProfile = useMutation({
    mutationFn: (data: { displayName?: string | null; bio?: string | null }) =>
      api.patch("/users/@me", data),
    onSuccess: () => {
      loadSession();
      toast.success("Profile updated");
      setEditingProfile(false);
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to update profile");
    },
  });

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 space-y-4">
        {/* User Card */}
        <div className="rounded-xl bg-background-secondary p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-header-primary truncate">
                {user?.displayName ?? user?.username}
              </h3>
              <p className="text-sm text-text-muted truncate">{user?.username}</p>
              {user?.email && (
                <p className="text-sm text-text-muted truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="rounded-xl bg-background-secondary p-4">
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-sm font-bold uppercase text-header-secondary">
              Edit Profile
            </h3>
            <span className="text-xs text-text-muted">
              {editingProfile ? "Collapse" : "Expand"}
            </span>
          </button>

          {editingProfile && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-header-secondary">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={32}
                  className="w-full rounded-lg bg-background-tertiary px-3 py-2.5 text-sm text-text-normal outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-header-secondary">
                  About Me
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={190}
                  rows={3}
                  className="w-full resize-none rounded-lg bg-background-tertiary px-3 py-2.5 text-sm text-text-normal outline-none focus:ring-2 focus:ring-brand"
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
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-background-secondary overflow-hidden">
          <SettingsLink
            icon={<Settings size={18} />}
            label="All Settings"
            onClick={() => openModal("userSettings")}
          />
          <SettingsLink
            icon={<Paintbrush size={18} />}
            label="Appearance"
            onClick={() => openModal("userSettings")}
          />
          <SettingsLink
            icon={<Bell size={18} />}
            label="Notifications"
            onClick={() => openModal("userSettings")}
          />
          <SettingsLink
            icon={<Key size={18} />}
            label="Security"
            onClick={() => openModal("userSettings")}
          />
          <SettingsLink
            icon={<Eye size={18} />}
            label="Accessibility"
            onClick={() => openModal("userSettings")}
          />
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red/10 py-3 text-sm font-medium text-red transition-colors hover:bg-red/20"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}

function SettingsLink({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3",
        "text-sm text-text-normal",
        "border-b border-background-primary last:border-b-0",
        "transition-colors hover:bg-background-hover"
      )}
    >
      <span className="text-text-muted">{icon}</span>
      {label}
    </button>
  );
}
