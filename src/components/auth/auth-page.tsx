"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background-tertiary">
      <div className="w-full max-w-[480px] rounded-md bg-background-primary p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-header-primary">
            {mode === "login" ? "Welcome back!" : "Create an account"}
          </h1>
          <p className="mt-2 text-text-muted">
            {mode === "login"
              ? "We're so excited to see you again!"
              : "We're so excited to have you!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-header-secondary">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[3px] border-none bg-background-tertiary px-3 py-2.5 text-text-normal outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[3px] bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {loading
              ? "..."
              : mode === "login"
                ? "Log In"
                : "Continue"}
          </button>
        </form>

        <p className="mt-4 text-sm text-text-muted">
          {mode === "login" ? (
            <>
              Need an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-text-link hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-text-link hover:underline"
              >
                Log In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
