import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Fingerprint, Plus, Trash2, Shield, AlertTriangle } from "lucide-react";

interface Passkey {
  id: string;
  credentialId: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
}

function isBrowserSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

export function PasskeySettings() {
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();

  const supported = isBrowserSupported();

  const passkeysQuery = useQuery({
    queryKey: ["passkeys"],
    queryFn: () => api.get<{ passkeys: Passkey[] }>("/auth/passkeys"),
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      setError("");
      setAdding(true);

      const beginRes = await api.post<{
        challenge: string;
        rp: { name: string; id: string };
        user: { id: string; name: string; displayName: string };
        pubKeyCredParams: Array<{ alg: number; type: string }>;
        timeout: number;
        attestation: string;
        authenticatorSelection: object;
        excludeCredentials: Array<{ id: string; type: string }>;
      }>("/auth/passkeys/register/begin");

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(atob(beginRes.challenge.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
        rp: beginRes.rp,
        user: {
          id: Uint8Array.from(atob(beginRes.user.id.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
          name: beginRes.user.name,
          displayName: beginRes.user.displayName,
        },
        pubKeyCredParams: beginRes.pubKeyCredParams as PublicKeyCredentialParameters[],
        timeout: beginRes.timeout,
        attestation: beginRes.attestation as AttestationConveyancePreference,
        authenticatorSelection: beginRes.authenticatorSelection as AuthenticatorSelectionCriteria,
      };

      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
      if (!credential) throw new Error("Credential creation cancelled");

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey?.() ?? new ArrayBuffer(0))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      return api.post("/auth/passkeys/register/complete", {
        credentialId,
        publicKey: publicKeyBase64,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      setAdding(false);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to register passkey");
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (credentialId: string) =>
      api.delete(`/auth/passkeys/${encodeURIComponent(credentialId)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to remove passkey");
    },
  });

  const passkeys = passkeysQuery.data?.passkeys ?? [];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
          <Fingerprint className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Passkeys</h3>
          <p className="text-sm text-zinc-400">Use biometrics or security keys to sign in</p>
        </div>
      </div>

      {!supported && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            Your browser does not support passkeys. Please use a modern browser.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {passkeysQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-zinc-800 p-4">
              <div className="h-4 w-32 rounded bg-zinc-700" />
              <div className="mt-2 h-3 w-48 rounded bg-zinc-700" />
            </div>
          ))}
        </div>
      ) : passkeys.length === 0 ? (
        <div className="mb-4 rounded-lg border border-zinc-700 border-dashed p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
          <p className="text-sm text-zinc-400">No passkeys registered yet</p>
          <p className="text-xs text-zinc-500 mt-1">Add a passkey for passwordless sign-in</p>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-4"
            >
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {passkey.deviceType ?? "Passkey"}
                    {passkey.backedUp && (
                      <span className="ml-2 text-xs text-zinc-500">(synced)</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Added {new Date(passkey.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(passkey.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 transition-colors"
                title="Remove passkey"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => registerMutation.mutate()}
        disabled={!supported || adding || registerMutation.isPending}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          supported
            ? "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        )}
      >
        <Plus className="h-4 w-4" />
        {adding ? "Registering..." : "Add Passkey"}
      </button>
    </div>
  );
}
