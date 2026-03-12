import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { useGuildStore } from "@/stores/guild";
import { toast } from "sonner";
import { Compass, X, ArrowRight, Link, Users, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteInfo {
  code: string;
  guild: {
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
    memberCount?: number;
  };
  channel: {
    id: string;
    name: string;
  };
  inviter?: {
    id: string;
    username: string;
  };
  expiresAt: string | null;
  uses: number;
  maxUses: number;
}

export function DiscoverServersModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const selectGuild = useUIStore((s) => s.selectGuild);
  const [inviteInput, setInviteInput] = useState("");
  const [previewData, setPreviewData] = useState<InviteInfo | null>(null);
  const [joined, setJoined] = useState(false);

  // Extract invite code from input (handles full URLs or just the code)
  function extractCode(input: string): string {
    const trimmed = input.trim();
    // Handle URLs like https://example.com/invite/ABC123
    const urlMatch = trimmed.match(/\/invite\/([A-Za-z0-9_-]+)\s*$/);
    if (urlMatch) return urlMatch[1];
    // Otherwise treat the whole input as the code
    return trimmed;
  }

  // Preview an invite before joining
  const previewInvite = useMutation({
    mutationFn: (code: string) => api.get<InviteInfo>(`/invites/${code}`),
    onSuccess: (data) => {
      setPreviewData(data);
      setJoined(false);
    },
    onError: (err: any) => {
      setPreviewData(null);
      toast.error(err.message ?? "Invalid or expired invite link");
    },
  });

  // Accept the invite
  const acceptInvite = useMutation({
    mutationFn: (code: string) => api.post<any>(`/invites/${code}`, {}),
    onSuccess: (data) => {
      setJoined(true);
      toast.success("Joined server successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to join server");
    },
  });

  const handlePreview = () => {
    const code = extractCode(inviteInput);
    if (!code) {
      toast.error("Please enter an invite link or code");
      return;
    }
    previewInvite.mutate(code);
  };

  const handleJoin = () => {
    if (!previewData) return;
    acceptInvite.mutate(previewData.code);
  };

  const handleJoinAndNavigate = () => {
    if (!previewData) return;
    selectGuild(previewData.guild.id);
    closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePreview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div
        className="w-full max-w-[480px] rounded-lg bg-background-secondary overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <Compass size={24} className="text-brand-light" />
            <h2 className="text-lg font-bold text-header-primary">Join a Server</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-md text-interactive-normal hover:text-interactive-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Invite Input */}
        <div className="px-6 py-4">
          <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
            Invite Link or Code
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => {
                  setInviteInput(e.target.value);
                  setPreviewData(null);
                  setJoined(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com/invite/abc123 or abc123"
                className={cn(
                  "w-full rounded-md bg-background-tertiary pl-10 pr-3 py-2.5",
                  "text-sm text-text-normal outline-none",
                  "border border-transparent",
                  "focus:border-brand/50 focus:ring-1 focus:ring-brand/20",
                  "transition-all duration-200",
                  "placeholder:text-text-muted"
                )}
                autoFocus
              />
            </div>
            <button
              onClick={handlePreview}
              disabled={!inviteInput.trim() || previewInvite.isPending}
              className={cn(
                "flex items-center gap-1.5 rounded-md bg-brand px-4 py-2.5",
                "text-sm font-medium text-white",
                "transition-colors hover:bg-brand-hover",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {previewInvite.isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight size={16} />
                  Look Up
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Enter an invite link or code to preview and join a server.
          </p>
        </div>

        {/* Invite Preview */}
        {previewData && (
          <div className="px-6 pb-6">
            <div className="rounded-lg bg-background-tertiary p-4">
              <div className="flex items-center gap-4">
                {/* Guild Icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white">
                  {previewData.guild.icon ? (
                    <img
                      src={previewData.guild.icon}
                      alt={previewData.guild.name}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    previewData.guild.name[0]?.toUpperCase()
                  )}
                </div>

                {/* Guild Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-header-primary truncate">
                    {previewData.guild.name}
                  </h3>
                  {previewData.guild.description && (
                    <p className="text-sm text-text-muted line-clamp-2 mt-0.5">
                      {previewData.guild.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {previewData.guild.memberCount != null && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Users size={12} />
                        {previewData.guild.memberCount} members
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Hash size={12} />
                      {previewData.channel.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inviter */}
              {previewData.inviter && (
                <p className="mt-3 text-xs text-text-muted">
                  Invited by <span className="text-text-normal font-medium">{previewData.inviter.username}</span>
                </p>
              )}

              {/* Join Button */}
              <div className="mt-4">
                {joined ? (
                  <button
                    onClick={handleJoinAndNavigate}
                    className={cn(
                      "w-full rounded-md bg-green-600 py-2.5",
                      "text-sm font-medium text-white",
                      "transition-colors hover:bg-green-700"
                    )}
                  >
                    Joined! Click to open server
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={acceptInvite.isPending}
                    className={cn(
                      "w-full rounded-md bg-brand py-2.5",
                      "text-sm font-medium text-white",
                      "transition-colors hover:bg-brand-hover",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {acceptInvite.isPending ? "Joining..." : "Join Server"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no preview */}
        {!previewData && !previewInvite.isPending && (
          <div className="px-6 pb-6">
            <div className="rounded-lg border border-dashed border-surface-border p-6 text-center">
              <p className="text-sm text-text-muted">
                Ask a friend for an invite link to their server, or share your own invite links with others.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
