import { useQuery } from "@tanstack/react-query";
import { Hash, Users, ExternalLink, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";

interface PublicMessage {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  editedTimestamp: string | null;
}

interface PublicChannelData {
  channel: {
    id: string;
    name: string;
    topic: string | null;
    type: number;
    guildId: string | null;
  };
  guild: {
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
  } | null;
  messages: PublicMessage[];
}

interface PublicChannelViewProps {
  channelId: string;
}

async function fetchPublicChannel(
  channelId: string
): Promise<PublicChannelData> {
  const res = await fetch(`${API_URL}/public/channels/${channelId}`);
  if (!res.ok) {
    throw new Error("Channel not found or not public");
  }
  return res.json();
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PublicChannelView({ channelId }: PublicChannelViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-channel", channelId],
    queryFn: () => fetchPublicChannel(channelId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-zinc-900">
        <div className="h-14 bg-zinc-800 animate-pulse" />
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-400">
        <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
        <h2 className="text-xl font-semibold text-zinc-200 mb-2">
          Channel Not Available
        </h2>
        <p className="text-sm">
          This channel is not public or does not exist.
        </p>
      </div>
    );
  }

  const { channel, guild, messages } = data;

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 bg-zinc-800 border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {guild && (
            <>
              <span className="text-sm font-semibold text-zinc-200 truncate">
                {guild.name}
              </span>
              <span className="text-zinc-600">/</span>
            </>
          )}
          <Hash className="h-4 w-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-300 truncate">
            {channel.name}
          </span>
          {channel.topic && (
            <>
              <span className="text-zinc-700 mx-1">|</span>
              <span className="text-xs text-zinc-500 truncate">
                {channel.topic}
              </span>
            </>
          )}
        </div>
        <a
          href={guild ? `/invite/${guild.id}` : "#"}
          className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Join Server
        </a>
      </div>

      {/* Guild info banner */}
      {guild && (
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
          {guild.icon ? (
            <img
              src={guild.icon}
              alt={guild.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
              {guild.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-semibold text-zinc-100">{guild.name}</h1>
            {guild.description && (
              <p className="text-xs text-zinc-400 truncate">
                {guild.description}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
            <Users className="h-3.5 w-3.5" />
            Public Channel
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium shrink-0">
                {msg.authorId.slice(-2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-300">
                    User
                  </span>
                  <span className="text-xs text-zinc-600">
                    {formatTimestamp(msg.createdAt)}
                    {msg.editedTimestamp && " (edited)"}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 break-words">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Read-only footer */}
      <div className="px-4 py-3 bg-zinc-800 border-t border-zinc-700 text-center">
        <p className="text-sm text-zinc-500">
          This is a read-only view.{" "}
          <a
            href={guild ? `/invite/${guild.id}` : "#"}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Join the server
          </a>{" "}
          to participate in the conversation.
        </p>
      </div>
    </div>
  );
}
