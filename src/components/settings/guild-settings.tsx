"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import { X, Server, Shield, Users, Trash2, Bell, ClipboardList, BarChart3, Bot, Calendar } from "lucide-react";
import type { Role } from "@yxc/types";
import { ModerationPanel } from "../moderation/moderation-panel";
import { NotificationSettingsUI } from "./notification-settings";
import { BanAppealsPanel } from "../moderation/ban-appeals-panel";
import { AutoModSettings } from "./automod-settings";
import { EventList } from "../events/event-list";

type SettingsTab = "overview" | "roles" | "members" | "moderation" | "appeals" | "automod" | "audit" | "events" | "notifications" | "danger";

export function GuildSettings() {
  const { modalData, closeModal, openModal } = useUIStore();
  const guildId = modalData.guildId as string | undefined;
  const guildName = modalData.guildName as string | undefined;
  const [tab, setTab] = useState<SettingsTab>("overview");

  if (!guildId) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-background-tertiary">
      {/* Sidebar */}
      <div className="flex w-[218px] flex-col items-end bg-background-secondary pt-16 pr-2">
        <div className="w-[192px]">
          <p className="mb-1 truncate px-2.5 text-xs font-bold uppercase text-channel-default">
            {guildName ?? "Server Settings"}
          </p>
          <NavItem label="Overview" icon={<Server size={18} />} active={tab === "overview"} onClick={() => setTab("overview")} />
          <NavItem label="Roles" icon={<Shield size={18} />} active={tab === "roles"} onClick={() => setTab("roles")} />
          <NavItem label="Members" icon={<Users size={18} />} active={tab === "members"} onClick={() => setTab("members")} />
          <NavItem label="Moderation" icon={<ClipboardList size={18} />} active={tab === "moderation"} onClick={() => setTab("moderation")} />
          <NavItem label="Ban Appeals" icon={<Shield size={18} />} active={tab === "appeals"} onClick={() => setTab("appeals")} />
          <NavItem label="AutoMod" icon={<Bot size={18} />} active={tab === "automod"} onClick={() => setTab("automod")} />
          <NavItem label="Audit Log" icon={<BarChart3 size={18} />} active={tab === "audit"} onClick={() => setTab("audit")} />
          <NavItem label="Events" icon={<Calendar size={18} />} active={tab === "events"} onClick={() => setTab("events")} />
          <NavItem label="Notifications" icon={<Bell size={18} />} active={tab === "notifications"} onClick={() => setTab("notifications")} />

          <div className="my-2 h-px bg-background-primary" />

          <NavItem
            label="Delete Server"
            icon={<Trash2 size={18} />}
            active={tab === "danger"}
            onClick={() => setTab("danger")}
            danger
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-10 pt-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-header-primary">
            {tab === "overview" && "Server Overview"}
            {tab === "roles" && "Roles"}
            {tab === "members" && "Members"}
            {tab === "moderation" && "Moderation"}
            {tab === "appeals" && "Ban Appeals"}
            {tab === "automod" && "AutoMod"}
            {tab === "audit" && "Audit Log"}
            {tab === "events" && "Events"}
            {tab === "notifications" && "Notification Settings"}
            {tab === "danger" && "Delete Server"}
          </h1>
          <button
            onClick={closeModal}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-interactive-muted text-interactive-normal hover:border-interactive-hover hover:text-interactive-hover"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-w-[660px]">
          {tab === "overview" && <OverviewTab guildId={guildId} />}
          {tab === "roles" && <RolesTab guildId={guildId} />}
          {tab === "members" && <MembersTab guildId={guildId} />}
          {tab === "moderation" && <ModerationTab guildId={guildId} />}
          {tab === "appeals" && <BanAppealsTab guildId={guildId} />}
          {tab === "automod" && <AutoModSettings guildId={guildId} />}
          {tab === "audit" && <AuditLogTab guildId={guildId} />}
          {tab === "events" && <EventList guildId={guildId} />}
          {tab === "notifications" && <NotificationsTab guildId={guildId} />}
          {tab === "danger" && <DangerTab guildId={guildId} onClose={closeModal} />}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  label,
  icon,
  active,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-sm ${
        danger
          ? "text-red hover:bg-interactive-muted/20"
          : active
            ? "bg-interactive-muted/30 text-interactive-active"
            : "text-interactive-normal hover:bg-interactive-muted/20 hover:text-interactive-hover"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OverviewTab({ guildId }: { guildId: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const { data: guild } = useQuery({
    queryKey: ["guild", guildId],
    queryFn: () => api.get<any>(`/guilds/${guildId}`),
  });

  // Set initial values when guild data loads
  useState(() => {
    if (guild) {
      setName(guild.name ?? "");
      setDescription(guild.description ?? "");
    }
  });

  const updateGuild = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api.patch(`/guilds/${guildId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Server updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
          Server Name
        </label>
        <input
          type="text"
          value={name || guild?.name || ""}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
          Description
        </label>
        <textarea
          value={description || guild?.description || ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full resize-none rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <button
        onClick={() =>
          updateGuild.mutate({
            name: name || undefined,
            description: description || undefined,
          })
        }
        disabled={updateGuild.isPending}
        className="rounded-[3px] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
      >
        Save Changes
      </button>
    </div>
  );
}

function RolesTab({ guildId }: { guildId: string }) {
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", guildId],
    queryFn: () => api.get<Role[]>(`/guilds/${guildId}/roles`),
  });

  return (
    <div className="space-y-2">
      {roles
        .sort((a, b) => b.position - a.position)
        .map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between rounded bg-background-secondary p-3"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    role.color > 0
                      ? `#${role.color.toString(16).padStart(6, "0")}`
                      : "#99aab5",
                }}
              />
              <span className="text-sm text-header-primary">{role.name}</span>
            </div>
            <span className="text-xs text-text-muted">
              Position {role.position}
            </span>
          </div>
        ))}
    </div>
  );
}

function MembersTab({ guildId }: { guildId: string }) {
  const { data: members = [] } = useQuery({
    queryKey: ["members", guildId],
    queryFn: () => api.get<any[]>(`/guilds/${guildId}/members`),
  });

  return (
    <div className="space-y-1">
      {members.map((member) => {
        const user = member.user;
        return (
          <div
            key={member.userId}
            className="flex items-center gap-3 rounded p-2 hover:bg-background-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">
              {(user?.username ?? "?")?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-header-primary">
                {member.nickname ?? user?.displayName ?? user?.username}
              </p>
              <p className="text-xs text-text-muted">{user?.username}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DangerTab({ guildId, onClose }: { guildId: string; onClose: () => void }) {
  const [confirm, setConfirm] = useState("");
  const queryClient = useQueryClient();

  const deleteGuild = useMutation({
    mutationFn: () => api.delete(`/guilds/${guildId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      onClose();
      toast.success("Server deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4 rounded-lg border border-red/30 bg-background-secondary p-4">
      <p className="text-sm text-text-normal">
        Are you sure you want to delete this server? This action cannot be
        undone.
      </p>
      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
          Type DELETE to confirm
        </label>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-[3px] bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-red"
        />
      </div>
      <button
        onClick={() => deleteGuild.mutate()}
        disabled={confirm !== "DELETE" || deleteGuild.isPending}
        className="rounded-[3px] bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover disabled:opacity-50"
      >
        Delete Server
      </button>
    </div>
  );
}

function ModerationTab({ guildId }: { guildId: string }) {
  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        Review reported content and manage your moderation queue.
      </p>
      <ModerationPanel guildId={guildId} />
    </div>
  );
}

function AuditLogTab({ guildId }: { guildId: string }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit-log", guildId],
    queryFn: () => api.get<any[]>(`/guilds/${guildId}/audit-log?limit=50`),
  });

  return (
    <div className="space-y-1">
      {logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No audit log entries yet</p>
      ) : (
        logs.map((entry: any) => (
          <div key={entry.id} className="flex items-center gap-3 rounded bg-background-secondary p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-normal">
                <span className="font-medium text-header-primary">{entry.user?.username ?? "Unknown"}</span>
                {" performed "}
                <span className="font-medium text-brand">{entry.actionType}</span>
              </p>
              <p className="text-xs text-text-muted">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BanAppealsTab({ guildId }: { guildId: string }) {
  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        Review and manage ban appeals from users.
      </p>
      <BanAppealsPanel guildId={guildId} />
    </div>
  );
}

function NotificationsTab({ guildId }: { guildId: string }) {
  return (
    <div className="rounded-lg bg-background-secondary p-4">
      <NotificationSettingsUI guildId={guildId} />
    </div>
  );
}
