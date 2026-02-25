import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MemberPanelProps {
  guildId: string;
}

export function MemberPanel({ guildId }: MemberPanelProps) {
  const { data: members = [] } = useQuery({
    queryKey: ["members", guildId],
    queryFn: () => api.get<any[]>(`/guilds/${guildId}/members`),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border/30">
        <h3 className="font-bold text-header-primary text-sm">Members — {members.length}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {members.slice(0, 20).map((member: any, i: number) => (
          <div
            key={member.userId || i}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg",
              "hover:bg-background-hover/30 cursor-pointer",
              "transition-colors duration-150"
            )}
          >
            <div className="avatar avatar-sm">
              {member.user?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm text-text-normal truncate">
              {member.nickname || member.user?.displayName || member.user?.username || "Unknown"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
