"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePresenceStore } from "@/stores/presence";
import type { Member, Role } from "@yxc/types";
import { UserCard } from "./user-card";

interface MemberListProps {
  guildId: string;
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

export function MemberList({ guildId }: MemberListProps) {
  const [selectedMember, setSelectedMember] = useState<{
    user: any;
    member: Member;
    position: { x: number; y: number };
  } | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ["members", guildId],
    queryFn: () => api.get<Member[]>(`/guilds/${guildId}/members`),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", guildId],
    queryFn: () => api.get<Role[]>(`/guilds/${guildId}/roles`),
  });

  const getPresence = usePresenceStore((s) => s.getPresence);

  const online = members.filter((m) => {
    const presence = getPresence(m.userId);
    return presence.status !== "offline";
  });
  const offline = members.filter((m) => {
    const presence = getPresence(m.userId);
    return presence.status === "offline";
  });

  const handleMemberClick = (member: Member, user: any, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSelectedMember({
      user,
      member,
      position: { x: Math.max(0, rect.left - 310), y: rect.top },
    });
  };

  return (
    <aside className="w-60 overflow-y-auto bg-background-secondary scrollbar-thin">
      <div className="px-4 py-6">
        {/* Online */}
        {online.length > 0 && (
          <MemberGroup
            title={`Online — ${online.length}`}
            members={online}
            onMemberClick={handleMemberClick}
          />
        )}

        {/* Offline */}
        {offline.length > 0 && (
          <MemberGroup
            title={`Offline — ${offline.length}`}
            members={offline}
            onMemberClick={handleMemberClick}
          />
        )}

        {/* If no distinction yet, show all */}
        {online.length === 0 && offline.length === 0 && members.length > 0 && (
          <MemberGroup
            title={`Members — ${members.length}`}
            members={members}
            onMemberClick={handleMemberClick}
          />
        )}
      </div>

      {/* User card popup */}
      {selectedMember && (
        <UserCard
          user={selectedMember.user}
          member={selectedMember.member}
          roles={roles}
          position={selectedMember.position}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </aside>
  );
}

function MemberGroup({
  title,
  members,
  onMemberClick,
}: {
  title: string;
  members: Member[];
  onMemberClick: (member: Member, user: any, e: React.MouseEvent) => void;
}) {
  const getPresence = usePresenceStore((s) => s.getPresence);

  const statusColors: Record<string, string> = {
    online: "bg-status-online",
    idle: "bg-status-idle",
    dnd: "bg-status-dnd",
    offline: "bg-status-offline",
  };

  return (
    <div className="mb-2">
      <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-channel-default">
        {title}
      </h3>
      {members.map((member) => {
        const user = (member as any).user;
        const displayName = member.nickname ?? user?.displayName ?? user?.username ?? "Unknown";
        const color = getUserColor(member.userId);
        const presence = getPresence(member.userId);
        const statusColor = statusColors[presence.status] ?? "bg-status-offline";

        return (
          <button
            key={member.userId}
            onClick={(e) => onMemberClick(member, user, e)}
            className="group flex w-full items-center gap-3 rounded px-2 py-1.5 hover:bg-interactive-muted/20"
          >
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2.5px] border-background-secondary ${statusColor}`} />
            </div>

            <span className={`truncate text-sm font-medium ${presence.status === "offline" ? "text-text-muted" : "text-channel-default"} group-hover:text-channel-hover`}>
              {displayName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
