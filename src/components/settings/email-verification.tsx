import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Mail, Check, Shield, Clock } from "lucide-react";

export function EmailVerification() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const statusQuery = useQuery({
    queryKey: ["verificationStatus"],
    queryFn: () => api.get<{ verified: boolean }>("/auth/verify/status"),
  });

  useEffect(() => {
    if (statusQuery.data?.verified) {
      setVerified(true);
    }
  }, [statusQuery.data]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean }>("/auth/verify/send"),
    onSuccess: () => {
      setCountdown(60);
      setError("");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to send verification code");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (verificationCode: string) =>
      api.post<{ verified: boolean }>("/auth/verify/confirm", { code: verificationCode }),
    onSuccess: () => {
      setVerified(true);
      setShowSuccess(true);
      setError("");
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || "Invalid verification code");
    },
  });

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;

      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (value && index === 5) {
        const fullCode = newCode.join("");
        if (fullCode.length === 6) {
          confirmMutation.mutate(fullCode);
        }
      }
    },
    [code, confirmMutation]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;

      const newCode = [...code];
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i]!;
      }
      setCode(newCode);

      if (pasted.length === 6) {
        confirmMutation.mutate(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    },
    [code, confirmMutation]
  );

  if (statusQuery.isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-zinc-800" />
          <div className="h-4 w-72 rounded bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Email Verification</h3>
          <p className="text-sm text-zinc-400">Verify your email address to secure your account</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zinc-400">Status:</span>
        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            <Check className="h-3 w-3" />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
            <Shield className="h-3 w-3" />
            Unverified
          </span>
        )}
      </div>

      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-4 animate-in fade-in">
          <Check className="h-5 w-5 text-green-400" />
          <span className="text-sm text-green-400">Email verified successfully!</span>
        </div>
      )}

      {!verified && (
        <>
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || countdown > 0}
            className={cn(
              "mb-6 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              countdown > 0
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            )}
          >
            {countdown > 0 ? (
              <>
                <Clock className="h-4 w-4" />
                Resend in {countdown}s
              </>
            ) : sendMutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Verification Code
              </>
            )}
          </button>

          {countdown > 0 && (
            <div className="mb-4">
              <label className="mb-3 block text-sm font-medium text-zinc-300">
                Enter verification code
              </label>
              <div className="flex gap-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={cn(
                      "h-12 w-12 rounded-lg border bg-zinc-800 text-center text-lg font-mono text-zinc-100",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      error ? "border-red-500" : "border-zinc-700"
                    )}
                  />
                ))}
              </div>
              {confirmMutation.isPending && (
                <p className="mt-2 text-sm text-zinc-400">Verifying...</p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
