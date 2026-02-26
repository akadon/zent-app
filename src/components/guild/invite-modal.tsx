import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/stores/ui";
import { toast } from "sonner";
import { X, Copy, Check } from "lucide-react";

export function InviteModal() {
  const { modalData, closeModal } = useUIStore();
  const channelId = modalData.channelId as string | undefined;
  const guildName = modalData.guildName as string | undefined;
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInvite = useMutation({
    mutationFn: () =>
      api.post<{ code: string }>(`/channels/${channelId}/invites`, {
        maxAge: 86400,
        maxUses: 0,
      }),
    onSuccess: (data) => {
      setInviteCode(data.code);
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to create invite");
    },
  });

  useEffect(() => {
    if (channelId) {
      createInvite.mutate();
    }
  }, [channelId]);

  const inviteUrl = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : null;

  const handleCopy = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-[440px] rounded-md bg-background-primary p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-header-primary">
              Invite people
            </h2>
            {guildName && (
              <p className="text-sm text-text-muted">to {guildName}</p>
            )}
          </div>
          <button
            onClick={closeModal}
            className="text-interactive-normal hover:text-interactive-hover"
          >
            <X size={24} />
          </button>
        </div>

        <label htmlFor="invite-url" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
          Send an invite link to a friend
        </label>

        <div className="flex items-center gap-2">
          <input
            id="invite-url"
            type="text"
            readOnly
            value={inviteUrl ?? "Creating invite..."}
            className="flex-1 rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-sm text-text-normal outline-none"
          />
          <button
            onClick={handleCopy}
            disabled={!inviteUrl}
            className="flex items-center gap-1 rounded-[3px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          Your invite link expires in 24 hours.
        </p>
      </div>
    </div>
  );
}
