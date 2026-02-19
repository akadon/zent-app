"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePresenceStore } from "@/stores/presence";
import { cn } from "@/lib/utils";
import { ShieldBan, ShieldOff } from "lucide-react";
import type { User, Member, Role } from "@yxc/types";

interface UserCardProps {
  user: User;
  member?: Member;
  roles?: Role[];
  position: { x: number; y: number };
  onClose: () => void;
}

function getUserColor(userId: string): string {
  const colors = [
    "#f47067", "#e0823d", "#c9b12e", "#57ab5a", "#39c5cf",
    "#539bf5", "#b083f0", "#f076a8",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "online": return "bg-status-online";
    case "idle": return "bg-status-idle";
    case "dnd": return "bg-status-dnd";
    default: return "bg-status-offline";
  }
}

export function UserCard({ user, member, roles, position, onClose }: UserCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const presence = usePresenceStore((s) => s.getPresence(user.id));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const userColor = getUserColor(user.id);
  const memberRoles = roles?.filter((r) => member?.roles.includes(r.id)) ?? [];

  // Block/unblock
  const { data: blockStatus } = useQuery({
    queryKey: ["blockStatus", user.id],
    queryFn: async () => {
      try {
        const relationships = await api.get<Array<{ type: number; user: { id: string } }>>("/users/@me/relationships");
        const rel = relationships.find((r) => r.user.id === user.id);
        return rel?.type === 2;
      } catch {
        return false;
      }
    },
  });

  const blockUser = useMutation({
    mutationFn: () => api.put(`/users/${user.id}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockStatus", user.id] });
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
  });

  const unblockUser = useMutation({
    mutationFn: () => api.delete(`/users/${user.id}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockStatus", user.id] });
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
  });

  // Notes
  const { data: noteData } = useQuery({
    queryKey: ["userNote", user.id],
    queryFn: async () => {
      try {
        const res = await api.get<{ note: string }>(`/users/${user.id}/note`);
        return res.note ?? "";
      } catch {
        return "";
      }
    },
  });

  const [noteText, setNoteText] = useState("");
  const [noteInitialized, setNoteInitialized] = useState(false);

  useEffect(() => {
    if (noteData !== undefined && !noteInitialized) {
      setNoteText(noteData);
      setNoteInitialized(true);
    }
  }, [noteData, noteInitialized]);

  const saveNote = useMutation({
    mutationFn: (text: string) => api.put(`/users/${user.id}/note`, { note: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userNote", user.id] });
    },
  });

  const isBlocked = blockStatus === true;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[300px] rounded-lg border border-background-tertiary bg-background-floating shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      {/* Banner */}
      <div
        className="h-[60px] rounded-t-lg"
        style={{ backgroundColor: user.banner ? undefined : userColor }}
      >
        {user.banner && (
          <img src={user.banner} alt="" className="h-full w-full rounded-t-lg object-cover" />
        )}
      </div>

      {/* Avatar with status indicator */}
      <div className="relative px-4">
        <div className="absolute -top-8 rounded-full border-[5px] border-background-floating">
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ backgroundColor: userColor }}
              >
                {(user.displayName ?? user.username)?.[0]?.toUpperCase()}
              </div>
            )}
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full",
                "border-[3px] border-background-floating",
                getStatusColor(presence.status)
              )}
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-12">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-header-primary">
              {user.displayName ?? user.username}
            </h3>
            <p className="text-sm text-text-muted">{user.username}</p>
          </div>

          {/* Block/Unblock button */}
          <button
            onClick={() => isBlocked ? unblockUser.mutate() : blockUser.mutate()}
            disabled={blockUser.isPending || unblockUser.isPending}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "transition-all duration-200",
              "active:scale-90",
              isBlocked
                ? "bg-red/10 text-red hover:bg-red/20"
                : "bg-background-tertiary text-text-muted hover:bg-red/10 hover:text-red"
            )}
            title={isBlocked ? "Unblock" : "Block"}
          >
            {isBlocked ? <ShieldOff size={16} /> : <ShieldBan size={16} />}
          </button>
        </div>

        {/* Status text */}
        {presence.status !== "offline" && (
          <p className="mt-1 text-xs text-text-muted">
            {presence.customStatus?.text ?? presence.status}
          </p>
        )}

        {user.bio && (
          <div className="mt-3 border-t border-background-tertiary pt-3">
            <h4 className="mb-1 text-xs font-bold uppercase text-header-primary">About Me</h4>
            <p className="text-sm text-text-normal">{user.bio}</p>
          </div>
        )}

        {memberRoles.length > 0 && (
          <div className="mt-3 border-t border-background-tertiary pt-3">
            <h4 className="mb-1.5 text-xs font-bold uppercase text-header-primary">Roles</h4>
            <div className="flex flex-wrap gap-1">
              {memberRoles.map((role) => (
                <span
                  key={role.id}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, "0")}20` : "var(--background-tertiary)",
                    color: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "var(--text-muted)",
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#99aab5" }}
                  />
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 border-t border-background-tertiary pt-3">
          <h4 className="mb-1 text-xs font-bold uppercase text-header-primary">Member Since</h4>
          <p className="text-xs text-text-muted">
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Note */}
        <div className="mt-3 border-t border-background-tertiary pt-3">
          <h4 className="mb-1 text-xs font-bold uppercase text-header-primary">Note</h4>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => {
              if (noteText !== (noteData ?? "")) {
                saveNote.mutate(noteText);
              }
            }}
            placeholder="Click to add a note"
            rows={2}
            className={cn(
              "w-full resize-none rounded-md px-2.5 py-1.5 text-xs",
              "bg-background-tertiary text-text-normal",
              "placeholder:text-text-muted/50",
              "outline-none transition-colors duration-150",
              "focus:ring-1 focus:ring-brand/50"
            )}
          />
        </div>
      </div>
    </div>
  );
}
