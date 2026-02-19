"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePresenceStore } from "@/stores/presence";
import { gateway } from "@/gateway/client";
import { toast } from "sonner";
import { UserPlus, Check, X, MessageSquare, UserX, Users, Sparkles, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "online" | "all" | "pending" | "blocked" | "add";

interface Relationship {
  id: string;
  type: number; // 1=friend, 2=blocked, 3=incoming, 4=outgoing
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    avatar?: string | null;
    status?: string;
  };
}

interface FriendsPageProps {
  onOpenDM?: (channelId: string) => void;
}

export function FriendsPage({ onOpenDM }: FriendsPageProps) {
  const [tab, setTab] = useState<Tab>("online");
  const queryClient = useQueryClient();

  // Invalidate relationships on gateway events
  useEffect(() => {
    const unsubAdd = gateway.on("RELATIONSHIP_ADD", () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    });
    const unsubRemove = gateway.on("RELATIONSHIP_REMOVE", () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    });
    return () => {
      unsubAdd();
      unsubRemove();
    };
  }, [queryClient]);

  return (
    <div className="flex flex-1 flex-col bg-background-primary">
      {/* Header - Pill-style tabs */}
      <div className={cn(
        "flex h-14 items-center gap-6 px-6",
        "border-b border-surface-border/30"
      )}>
        <div className="flex items-center gap-2">
          <Users size={20} className="text-brand-light" />
          <span className="font-bold text-header-primary text-lg">Friends</span>
        </div>

        <div className="h-6 w-px bg-surface-border/50" />

        <div className="flex items-center gap-1 rounded-full bg-background-secondary/50 p-1">
          <TabButton label="Online" active={tab === "online"} onClick={() => setTab("online")} />
          <TabButton label="All" active={tab === "all"} onClick={() => setTab("all")} />
          <TabButton label="Pending" active={tab === "pending"} onClick={() => setTab("pending")} />
          <TabButton label="Blocked" active={tab === "blocked"} onClick={() => setTab("blocked")} />
        </div>

        <button
          onClick={() => setTab("add")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-gradient-to-r from-green to-green-hover",
            "text-sm font-semibold text-white",
            "transition-all duration-200",
            "hover:shadow-glow-sm hover:scale-[1.02]",
            "active:scale-95"
          )}
        >
          <UserPlus size={16} />
          Add Friend
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {tab === "add" ? <AddFriendTab /> : <FriendList filter={tab} onOpenDM={onOpenDM} />}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium",
        "transition-all duration-200",
        active
          ? "bg-brand/15 text-brand-light"
          : "text-text-muted hover:text-text-normal hover:bg-background-hover/50"
      )}
    >
      {label}
    </button>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "online": return "bg-status-online";
    case "idle": return "bg-status-idle";
    case "dnd": return "bg-status-dnd";
    default: return "bg-status-offline";
  }
}

function FriendList({ filter, onOpenDM }: { filter: "online" | "all" | "pending" | "blocked"; onOpenDM?: (channelId: string) => void }) {
  const { data: relationships = [] } = useQuery({
    queryKey: ["relationships"],
    queryFn: () => api.get<Relationship[]>("/users/@me/relationships"),
  });

  const getPresence = usePresenceStore((s) => s.getPresence);
  const queryClient = useQueryClient();

  const acceptRequest = useMutation({
    mutationFn: (targetId: string) => api.put(`/users/@me/relationships/${targetId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["relationships"] }),
  });

  const removeFriend = useMutation({
    mutationFn: (targetId: string) => api.delete(`/users/@me/relationships/${targetId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["relationships"] }),
  });

  const createDM = useMutation({
    mutationFn: (recipientId: string) =>
      api.post<{ id: string }>("/users/@me/channels", { recipientId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dmChannels"] });
      if (onOpenDM && data?.id) {
        onOpenDM(data.id);
      }
    },
  });

  const unblockUser = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["relationships"] }),
  });

  let filtered: Relationship[];
  if (filter === "blocked") {
    filtered = relationships.filter((r) => r.type === 2);
  } else if (filter === "pending") {
    filtered = relationships.filter((r) => r.type === 3 || r.type === 4);
  } else if (filter === "online") {
    filtered = relationships.filter((r) => {
      if (r.type !== 1) return false;
      const presence = getPresence(r.user.id);
      return presence.status !== "offline";
    });
  } else {
    filtered = relationships.filter((r) => r.type === 1);
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand/20 to-accent-purple/20 blur-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={32} className="text-brand-light/60" />
          </div>
        </div>
        <p className="text-text-muted text-center max-w-xs">
          {filter === "blocked"
            ? "No blocked users"
            : filter === "pending"
              ? "No pending friend requests"
              : filter === "online"
                ? "No friends online right now"
                : "No friends yet. Add some!"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className={cn(
        "mb-4 px-2 text-xs font-bold uppercase tracking-wider text-text-muted"
      )}>
        {filter === "blocked"
          ? "Blocked"
          : filter === "pending"
            ? "Pending"
            : filter === "online"
              ? "Online"
              : "All Friends"}{" "}
        — {filtered.length}
      </p>
      <div className="space-y-1">
        {filtered.map((rel, index) => {
          const presence = getPresence(rel.user.id);
          return (
            <div
              key={rel.id}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl",
                "transition-all duration-200",
                "hover:bg-background-secondary/50",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={cn(
                    "avatar avatar-md",
                    "bg-gradient-to-br from-brand to-brand-dark"
                  )}>
                    {(rel.user.displayName ?? rel.user.username)?.[0]?.toUpperCase()}
                  </div>
                  <div
                    className={cn(
                      "status-indicator status-indicator-sm",
                      getStatusColor(presence.status)
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-header-primary">
                    {rel.user.displayName ?? rel.user.username}
                  </p>
                  <p className="text-xs text-text-muted">
                    {rel.type === 2
                      ? "Blocked"
                      : rel.type === 3
                        ? "Incoming Friend Request"
                        : rel.type === 4
                          ? "Outgoing Friend Request"
                          : presence.customStatus?.text
                            ? presence.customStatus.text
                            : presence.status}
                  </p>
                </div>
              </div>

              <div className="flex gap-1.5">
                {rel.type === 3 && (
                  <>
                    <ActionButton
                      icon={<Check size={16} />}
                      variant="success"
                      tooltip="Accept"
                      onClick={() => acceptRequest.mutate(rel.user.id)}
                    />
                    <ActionButton
                      icon={<X size={16} />}
                      variant="danger"
                      tooltip="Decline"
                      onClick={() => removeFriend.mutate(rel.user.id)}
                    />
                  </>
                )}
                {rel.type === 1 && (
                  <>
                    <ActionButton
                      icon={<MessageSquare size={16} />}
                      variant="default"
                      tooltip="Message"
                      onClick={() => createDM.mutate(rel.user.id)}
                    />
                    <ActionButton
                      icon={<UserX size={16} />}
                      variant="danger"
                      tooltip="Remove Friend"
                      onClick={() => removeFriend.mutate(rel.user.id)}
                    />
                  </>
                )}
                {rel.type === 2 && (
                  <ActionButton
                    icon={<ShieldOff size={16} />}
                    variant="danger"
                    tooltip="Unblock"
                    onClick={() => unblockUser.mutate(rel.user.id)}
                  />
                )}
                {rel.type === 4 && (
                  <ActionButton
                    icon={<X size={16} />}
                    variant="danger"
                    tooltip="Cancel"
                    onClick={() => removeFriend.mutate(rel.user.id)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  variant,
  tooltip,
  onClick,
}: {
  icon: React.ReactNode;
  variant: "default" | "success" | "danger";
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl",
        "transition-all duration-200",
        "active:scale-90",
        variant === "success" && "bg-background-tertiary text-text-muted hover:bg-green/20 hover:text-green-light",
        variant === "danger" && "bg-background-tertiary text-text-muted hover:bg-red/20 hover:text-red-light",
        variant === "default" && "bg-background-tertiary text-text-muted hover:bg-brand/15 hover:text-brand-light"
      )}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

function AddFriendTab() {
  const [userId, setUserId] = useState("");
  const queryClient = useQueryClient();

  const sendRequest = useMutation({
    mutationFn: (id: string) =>
      api.post("/users/@me/relationships", { userId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      setUserId("");
      toast.success("Friend request sent");
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to send request"),
  });

  return (
    <div className="max-w-xl animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-green/20 to-brand/20"
        )}>
          <UserPlus size={20} className="text-green-light" />
        </div>
        <h3 className="text-lg font-bold text-header-primary">
          Add Friend
        </h3>
      </div>
      <p className="mb-6 text-sm text-text-muted pl-[52px]">
        Enter a user ID to send a friend request.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (userId.trim()) sendRequest.mutate(userId.trim());
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter a user ID"
          className={cn(
            "flex-1 px-4 py-3 rounded-xl",
            "bg-background-tertiary/80 text-text-normal",
            "placeholder:text-text-muted/60",
            "border border-surface-border/50",
            "outline-none transition-all duration-200",
            "focus:border-brand/50 focus:shadow-glow-sm"
          )}
        />
        <button
          type="submit"
          disabled={!userId.trim() || sendRequest.isPending}
          className={cn(
            "px-6 py-3 rounded-xl",
            "bg-gradient-to-r from-brand to-brand-dark",
            "text-sm font-semibold text-white",
            "transition-all duration-200",
            "hover:shadow-glow hover:scale-[1.02]",
            "active:scale-95",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          Send Friend Request
        </button>
      </form>
    </div>
  );
}
