"use client";

import { useEffect, useRef } from "react";
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

export function UserCard({ user, member, roles, position, onClose }: UserCardProps) {
  const ref = useRef<HTMLDivElement>(null);

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

      {/* Avatar */}
      <div className="relative px-4">
        <div className="absolute -top-8 rounded-full border-[5px] border-background-floating">
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
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-12">
        <h3 className="text-lg font-bold text-header-primary">
          {user.displayName ?? user.username}
        </h3>
        <p className="text-sm text-text-muted">{user.username}</p>

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
      </div>
    </div>
  );
}
