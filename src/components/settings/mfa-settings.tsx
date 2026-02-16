"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Shield, Key, Copy, Check, AlertTriangle } from "lucide-react";

type MfaStep = "idle" | "setup" | "verify" | "backup" | "disable";

export function MFASettings() {
  const [step, setStep] = useState<MfaStep>("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const setupMutation = useMutation({
    mutationFn: () => api.post<{ secret: string; uri: string }>("/auth/mfa/setup"),
    onSuccess: (data) => {
      setSecret(data.secret);
      setUri(data.uri);
      setStep("verify");
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to start MFA setup");
    },
  });

  const enableMutation = useMutation({
    mutationFn: () =>
      api.post<{ enabled: boolean; backupCodes: string[] }>("/auth/mfa/enable", {
        code,
        secret,
      }),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep("backup");
      setMfaEnabled(true);
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message || "Invalid verification code");
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => api.post<{ disabled: boolean }>("/auth/mfa/disable", { password }),
    onSuccess: () => {
      setMfaEnabled(false);
      setStep("idle");
      setPassword("");
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to disable MFA");
    },
  });

  const copyToClipboard = async (text: string, setCopiedFn: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  const copyAllBackupCodes = () => {
    copyToClipboard(backupCodes.join("\n"), setCopied);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-zinc-100">Two-Factor Authentication</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {step === "idle" && !mfaEnabled && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Add an extra layer of security to your account by enabling two-factor authentication.
            You will need an authenticator app like Google Authenticator or Authy.
          </p>
          <button
            onClick={() => setupMutation.mutate()}
            disabled={setupMutation.isPending}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <Key className="h-4 w-4" />
            {setupMutation.isPending ? "Setting up..." : "Enable Two-Factor Auth"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Scan the QR code with your authenticator app, or manually enter the secret key below.
          </p>

          <div className="rounded-md bg-zinc-800 border border-zinc-700 p-4 space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              OTPAuth URI
            </p>
            <p className="text-xs text-zinc-400 break-all font-mono">{uri}</p>
          </div>

          <div className="rounded-md bg-zinc-800 border border-zinc-700 p-4 space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Secret Key
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-zinc-200 font-mono tracking-widest">{secret}</code>
              <button
                onClick={() => copyToClipboard(secret, setCopiedSecret)}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copiedSecret ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-center text-lg tracking-[0.5em]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("idle");
                setError("");
              }}
              className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => enableMutation.mutate()}
              disabled={code.length !== 6 || enableMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {enableMutation.isPending ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        </div>
      )}

      {step === "backup" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Save these backup codes in a safe place. Each code can only be used once.
          </div>

          <div className="rounded-md bg-zinc-800 border border-zinc-700 p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((bc, i) => (
                <code
                  key={i}
                  className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 font-mono text-center"
                >
                  {bc}
                </code>
              ))}
            </div>
          </div>

          <button
            onClick={copyAllBackupCodes}
            className="flex items-center gap-2 rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All Codes
              </>
            )}
          </button>

          <button
            onClick={() => setStep("idle")}
            className="block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {step === "idle" && mfaEnabled && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
            <Shield className="h-4 w-4 shrink-0" />
            Two-factor authentication is enabled.
          </div>

          <button
            onClick={() => {
              setStep("disable");
              setError("");
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
          >
            Disable Two-Factor Auth
          </button>
        </div>
      )}

      {step === "disable" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Enter your password to disable two-factor authentication.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("idle");
                setPassword("");
                setError("");
              }}
              className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => disableMutation.mutate()}
              disabled={!password || disableMutation.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {disableMutation.isPending ? "Disabling..." : "Disable MFA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
