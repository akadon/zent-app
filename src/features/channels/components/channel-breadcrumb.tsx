import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Channel } from "@yxc/types";
import { ChannelType } from "@yxc/types";
import { Hash, Volume2, Radio, ChevronRight } from "lucide-react";

interface ChannelBreadcrumbProps {
  guildId: string;
  channelId: string;
}

export function ChannelBreadcrumb({ guildId, channelId }: ChannelBreadcrumbProps) {
  const { data: channels = [] } = useQuery({
    queryKey: ["channels", guildId],
    queryFn: () => api.get<Channel[]>(`/guilds/${guildId}/channels`),
  });

  const channel = channels.find(c => c.id === channelId);
  if (!channel) return null;

  const Icon = channel.type === ChannelType.GUILD_VOICE ? Volume2 :
               channel.type === ChannelType.GUILD_STAGE_VOICE ? Radio : Hash;

  return (
    <>
      <ChevronRight size={14} className="text-text-muted/50" />
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
        "bg-brand/10 text-brand-light"
      )}>
        <Icon size={14} />
        <span className="font-medium">{channel.name}</span>
      </div>
    </>
  );
}
