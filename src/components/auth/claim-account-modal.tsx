import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { Modal } from "@/shared/components/modal";
import { toast } from "sonner";

interface ClaimAccountModalProps {
  onClose: () => void;
}

export function ClaimAccountModal({ onClose }: ClaimAccountModalProps) {
  const { user, claimAccount } = useAuthStore();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await claimAccount(email, username, password);
      toast.success("Account claimed successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to claim account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Claim Your Account">
      <p className="mb-4 text-sm text-text-muted">
        Set up an email and password to keep your account permanently.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="claim-email"
            className="mb-2 block text-xs font-bold uppercase text-header-secondary"
          >
            Email
          </label>
          <input
            id="claim-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="claim-username"
            className="mb-2 block text-xs font-bold uppercase text-header-secondary"
          >
            Username
          </label>
          <input
            id="claim-username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label
            htmlFor="claim-password"
            className="mb-2 block text-xs font-bold uppercase text-header-secondary"
          >
            Password
          </label>
          <input
            id="claim-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[3px] bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? "Claiming..." : "Claim Account"}
        </button>
      </form>
    </Modal>
  );
}
