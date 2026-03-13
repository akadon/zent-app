import { create } from "zustand";
import type { User, AuthResponse } from "@yxc/types";
import { api } from "@/lib/api";

interface MfaRequired {
  mfa: true;
  ticket: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<MfaRequired | void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  guestLogin: (displayName?: string) => Promise<void>;
  claimAccount: (email: string, username: string, password: string) => Promise<void>;
  isGuest: () => boolean;
  logout: () => void;
  loadSession: () => Promise<void>;
  verifyMfa: (code: string, ticket: string) => Promise<void>;
  setAuth: (token: string, user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });

    if (res.token === null && res.mfa) {
      return { mfa: true, ticket: res.ticket! };
    }

    api.setToken(res.token!);
    set({ user: res.user!, token: res.token! });
  },

  register: async (email, username, password) => {
    const res = await api.post<AuthResponse>("/auth/register", {
      email,
      username,
      password,
    });
    api.setToken(res.token!);
    set({ user: res.user!, token: res.token! });
  },

  guestLogin: async (displayName?: string) => {
    const res = await api.post<AuthResponse>("/auth/guest", displayName ? { displayName } : undefined);
    api.setToken(res.token!);
    set({ user: res.user!, token: res.token!, isLoading: false });
  },

  claimAccount: async (email, username, password) => {
    const res = await api.post<{ user: User }>("/auth/claim", {
      email,
      username,
      password,
    });
    set({ user: res.user });
  },

  isGuest: () => get().user?.isGuest ?? false,

  logout: () => {
    // fire and forget server-side session revocation
    api.delete("/users/@me/sessions/current").catch((e) => console.warn("Session revocation failed:", e));
    api.setToken(null);
    set({ user: null, token: null });
  },

  loadSession: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await api.get<User>("/users/@me");
      set({ user, token, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, token: null, isLoading: false });
    }
  },

  verifyMfa: async (code, ticket) => {
    const res = await api.post<{ token: string; user: User }>("/auth/mfa/verify", {
      code,
      ticket,
    });
    api.setToken(res.token);
    set({ user: res.user, token: res.token });
  },

  setAuth: (token, user) => {
    api.setToken(token);
    set({ user, token });
  },
}));
