import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
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

type ListItem =
  | { type: "header"; title: string }
  | { type: "member"; member: Member };

export function MemberList({ guildId }: MemberListProps) {
  const [selectedMember, setSelectedMember] = useState<{
    user: any;
    member: Member;
    position: { x: number; y: number };
  } | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ["members", guildId],
    queryFn: () => api.get<Member[]>(`/guilds/${guildId}/members?limit=1000`),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", guildId],
    queryFn: () => api.get<Role[]>(`/guilds/${guildId}/roles`),
  });

  const getPresence = usePresenceStore((s) => s.getPresence);

  // Build a flat list with section headers for Virtuoso
  const items: ListItem[] = useMemo(() => {
    const online: Member[] = [];
    const offline: Member[] = [];

    for (const m of members) {
      const p = getPresence(m.userId);
      if (p.status !== "offline") online.push(m);
      else offline.push(m);
    }

    const result: ListItem[] = [];
    if (online.length > 0) {
      result.push({ type: "header", title: `Online \u2014 ${online.length}` });
      for (const m of online) result.push({ type: "member", member: m });
    }
    if (offline.length > 0) {
      result.push({ type: "header", title: `Offline \u2014 ${offline.length}` });
      for (const m of offline) result.push({ type: "member", member: m });
    }
    if (online.length === 0 && offline.length === 0 && members.length > 0) {
      result.push({ type: "header", title: `Members \u2014 ${members.length}` });
      for (const m of members) result.push({ type: "member", member: m });
    }
    return result;
  }, [members, getPresence]);

  const handleMemberClick = useCallback(
    (member: Member, user: any, e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSelectedMember({
        user,
        member,
        position: { x: Math.max(0, rect.left - 310), y: rect.top },
      });
    },
    []
  );

  const statusColors: Record<string, string> = {
    online: "bg-status-online",
    idle: "bg-status-idle",
    dnd: "bg-status-dnd",
    offline: "bg-status-offline",
  };

  return (
    <aside className="w-60 overflow-hidden bg-background-secondary flex flex-col">
      <Virtuoso
        data={items}
        className="scrollbar-thin"
        style={{ flex: 1 }}
        itemContent={(_, item) => {
          if (item.type === "header") {
            return (
              <h3 className="mb-1 mt-4 px-6 text-xs font-semibold uppercase text-channel-default">
                {item.title}
              </h3>
            );
          }
          const member = item.member;
          const user = (member as any).user;
          const displayName =
            member.nickname ?? user?.displayName ?? user?.username ?? "Unknown";
          const color = getUserColor(member.userId);
          const presence = getPresence(member.userId);
          const statusColor =
            statusColors[presence.status] ?? "bg-status-offline";

          return (
            <button
              onClick={(e) => handleMemberClick(member, user, e)}
              className="group flex w-full items-center gap-3 rounded px-6 py-1.5 hover:bg-interactive-muted/20"
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
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2.5px] border-background-secondary ${statusColor}`}
                />
              </div>
              <span
                className={`truncate text-sm font-medium ${presence.status === "offline" ? "text-text-muted" : "text-channel-default"} group-hover:text-channel-hover`}
              >
                {displayName}
              </span>
            </button>
          );
        }}
      />

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
