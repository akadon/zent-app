"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Key, Copy, AlertTriangle, Check, Shield } from "lucide-react";

export function RecoveryKeySettings() {
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const statusQuery = useQuery({
    queryKey: ["recoveryKeyStatus"],
    queryFn: () => api.get<{ hasRecoveryKey: boolean }>("/auth/recovery/status"),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<{ recoveryKey: string; message: string }>("/auth/recovery/generate"),
    onSuccess: (data) => {
      setRecoveryKey(data.recoveryKey);
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to generate recovery key");
    },
  });

  const handleCopy = async () => {
    if (!recoveryKey) return;
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const hasKey = statusQuery.data?.hasRecoveryKey ?? false;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
          <Key className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Recovery Key</h3>
          <p className="text-sm text-zinc-400">
            Generate a recovery key to regain access if you lose your credentials
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zinc-400">Status:</span>
        {hasKey ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            <Shield className="h-3 w-3" />
            Recovery key set
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-medium text-zinc-400">
            <Shield className="h-3 w-3" />
            No recovery key
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {recoveryKey && (
        <div className="mb-6 space-y-3">
          <div className="rounded-lg bg-zinc-950 border border-zinc-700 p-4">
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 break-all font-mono text-sm text-amber-300">
                {recoveryKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-400">
              <p className="font-medium">Save this key in a safe place</p>
              <p className="mt-1 text-yellow-400/80">
                This recovery key will only be displayed once. If you lose it, you will need to
                generate a new one. Store it in a password manager or write it down and keep it
                secure.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setRecoveryKey(null);
          setCopied(false);
          generateMutation.mutate();
        }}
        disabled={generateMutation.isPending}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          "bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        )}
      >
        <Key className="h-4 w-4" />
        {generateMutation.isPending
          ? "Generating..."
          : hasKey
            ? "Regenerate Recovery Key"
            : "Generate Recovery Key"}
      </button>
    </div>
  );
}
