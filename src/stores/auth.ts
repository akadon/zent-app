import { create } from "zustand";
import type { User, AuthResponse } from "@yxc/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    api.setToken(res.token);
    set({ user: res.user, token: res.token });
  },

  register: async (email, username, password) => {
    const res = await api.post<AuthResponse>("/auth/register", {
      email,
      username,
      password,
    });
    api.setToken(res.token);
    set({ user: res.user, token: res.token });
  },

  logout: () => {
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
}));
