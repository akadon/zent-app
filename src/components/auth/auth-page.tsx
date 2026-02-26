import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Fingerprint } from "lucide-react";

type AuthMode = "login" | "register" | "mfa" | "recovery";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaTicket, setMfaTicket] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");

  const { login, register, verifyMfa, setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (result?.mfa) {
          setMfaTicket(result.ticket);
          setMode("mfa");
        }
      } else if (mode === "register") {
        await register(email, username, password);
      } else if (mode === "mfa") {
        await verifyMfa(mfaCode, mfaTicket);
      } else if (mode === "recovery") {
        const res = await api.post<{ token: string; user: any }>("/auth/recovery/use", {
          email,
          recoveryKey,
        });
        setAuth(res.token, res.user);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      const beginRes = await api.post<{
        challenge: string;
        rpId: string;
        timeout: number;
        allowCredentials?: Array<{ id: string; type: string }>;
        userVerification?: string;
      }>("/auth/passkeys/authenticate/begin");

      const allowCredentials = (beginRes.allowCredentials ?? []).map((cred) => ({
        id: Uint8Array.from(
          atob(cred.id.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0)
        ),
        type: cred.type as PublicKeyCredentialType,
      }));

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(
            atob(beginRes.challenge.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0)
          ),
          rpId: beginRes.rpId,
          timeout: beginRes.timeout,
          allowCredentials,
          userVerification: (beginRes.userVerification as UserVerificationRequirement) ?? "preferred",
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Passkey authentication cancelled");

      const response = credential.response as AuthenticatorAssertionResponse;
      const toBase64Url = (buf: ArrayBuffer) =>
        btoa(String.fromCharCode(...new Uint8Array(buf)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

      const res = await api.post<{ token: string; user: any }>(
        "/auth/passkeys/authenticate/complete",
        {
          credentialId: toBase64Url(credential.rawId),
          authenticatorData: toBase64Url(response.authenticatorData),
          clientDataJSON: toBase64Url(response.clientDataJSON),
          signature: toBase64Url(response.signature),
          userHandle: response.userHandle ? toBase64Url(response.userHandle) : null,
        }
      );

      setAuth(res.token, res.user);
    } catch (err: any) {
      toast.error(err.message ?? "Passkey authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setMfaCode("");
    setMfaTicket("");
    setRecoveryKey("");
  };

  return (
    <main className="flex h-screen items-center justify-center bg-background-tertiary">
      <div className="w-full max-w-[480px] rounded-md bg-background-primary p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-header-primary">
            {mode === "login" && "Welcome back!"}
            {mode === "register" && "Create an account"}
            {mode === "mfa" && "Two-Factor Authentication"}
            {mode === "recovery" && "Account Recovery"}
          </h1>
          <p className="mt-2 text-text-muted">
            {mode === "login" && "We're so excited to see you again!"}
            {mode === "register" && "We're so excited to have you!"}
            {mode === "mfa" && "Enter the 6-digit code from your authenticator app"}
            {mode === "recovery" && "Enter your email and recovery key to regain access"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* MFA mode */}
          {mode === "mfa" && (
            <div>
              <label htmlFor="mfa-code" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                Authentication Code
              </label>
              <input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand font-mono text-center text-lg tracking-[0.5em]"
                autoFocus
              />
            </div>
          )}

          {/* Recovery mode */}
          {mode === "recovery" && (
            <>
              <div>
                <label htmlFor="recovery-email" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                  Email
                </label>
                <input
                  id="recovery-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label htmlFor="recovery-key" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                  Recovery Key
                </label>
                <input
                  id="recovery-key"
                  type="text"
                  required
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand font-mono"
                  placeholder="Enter your recovery key"
                />
              </div>
            </>
          )}

          {/* Login / Register mode */}
          {(mode === "login" || mode === "register") && (
            <>
              <div>
                <label htmlFor="auth-email" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label htmlFor="auth-username" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                    Username
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-password" className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("recovery")}
                  className="text-xs text-text-link hover:underline"
                >
                  Use Recovery Key
                </button>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "mfa" && mfaCode.length !== 6)}
            className="w-full rounded-[3px] bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "login"
                ? "Log In"
                : mode === "register"
                  ? "Continue"
                  : mode === "mfa"
                    ? "Verify"
                    : "Recover Account"}
          </button>
        </form>

        {/* Passkey login button - only on login mode */}
        {mode === "login" && typeof window !== "undefined" && window.PublicKeyCredential && (
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] border border-interactive-muted bg-transparent py-2.5 text-sm font-medium text-text-normal transition-colors hover:border-interactive-hover hover:text-interactive-hover disabled:opacity-50"
          >
            <Fingerprint className="h-4 w-4" />
            Sign in with Passkey
          </button>
        )}

        <p className="mt-4 text-sm text-text-muted">
          {mode === "login" && (
            <>
              Need an account?{" "}
              <button
                onClick={() => switchMode("register")}
                className="text-text-link hover:underline"
              >
                Register
              </button>
            </>
          )}
          {mode === "register" && (
            <>
              Already have an account?{" "}
              <button
                onClick={() => switchMode("login")}
                className="text-text-link hover:underline"
              >
                Log In
              </button>
            </>
          )}
          {mode === "mfa" && (
            <button
              onClick={() => switchMode("login")}
              className="text-text-link hover:underline"
            >
              Back to Login
            </button>
          )}
          {mode === "recovery" && (
            <button
              onClick={() => switchMode("login")}
              className="text-text-link hover:underline"
            >
              Back to Login
            </button>
          )}
        </p>
      </div>
    </main>
  );
}
