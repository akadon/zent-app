import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { Toaster } from "sonner";
import { QuickSwitcher } from "./layout/quick-switcher";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { usePresenceStore } from "@/stores/presence";
import { useGuildStore } from "@/stores/guild";
import { api } from "@/lib/api";
import { initGuildPolling } from "@/features/guilds/services/guild-service";

import type { Guild, Channel, Member } from "@yxc/types";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  const loadSession = useAuthStore((s) => s.loadSession);
  const token = useAuthStore((s) => s.token);
  const initialized = useRef(false);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Fetch initial state via REST + start polling (replaces gateway)
  useEffect(() => {
    if (!token) {
      if (initialized.current) {
        queryClient.clear();
        usePresenceStore.setState({ presences: new Map() });
        useGuildStore.setState({
          guilds: [],
          channels: new Map(),
          members: new Map(),
          voiceStates: new Map(),
          readStates: [],
        });
      }
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    let cancelled = false;

    (async () => {
      try {
        const state = await api.get<{
          guilds: Guild[];
          channels: Record<string, Channel[]>;
          members: Record<string, Member[]>;
        }>("/users/@me/state");

        if (cancelled) return;

        const channelsMap = new Map<string, Channel[]>();
        const membersMap = new Map<string, Member[]>();

        for (const [guildId, channels] of Object.entries(state.channels)) {
          channelsMap.set(guildId, channels);
        }
        for (const [guildId, members] of Object.entries(state.members)) {
          membersMap.set(guildId, members);
        }

        useGuildStore.setState({
          guilds: state.guilds,
          channels: channelsMap,
          members: membersMap,
        });

        // Hydrate presence from member data
        const presenceEntries: Array<{
          userId: string;
          data: { status: "online" | "idle" | "dnd" | "offline"; customStatus: { text?: string; emoji?: string } | null };
        }> = [];

        for (const members of Object.values(state.members)) {
          for (const member of members) {
            const user = member.user as any;
            if (user?.status && user.status !== "offline") {
              presenceEntries.push({
                userId: user.id,
                data: {
                  status: user.status,
                  customStatus: user.customStatus ?? null,
                },
              });
            }
          }
        }
        if (presenceEntries.length > 0) {
          usePresenceStore.getState().bulkSetPresences(presenceEntries);
        }

        useUIStore.getState().setConnectionStatus("connected");
      } catch (err) {
        console.error("Failed to load initial state:", err);
        useUIStore.getState().setConnectionStatus("disconnected");
      }
    })();

    // Start guild polling for real-time updates
    const stopPolling = initGuildPolling(queryClient);

    return () => {
      cancelled = true;
      stopPolling();
      initialized.current = false;
    };
  }, [token, queryClient]);

  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);

  useKeyboardShortcuts();

  // Load accessibility settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("accessibility-settings");
      if (saved) {
        const settings = JSON.parse(saved);
        const fontFamily = settings.fontFamily ?? settings.font;
        if (fontFamily && fontFamily !== "default") {
          document.body.style.fontFamily = `"${fontFamily}", sans-serif`;
        }
        if (settings.fontSize) document.documentElement.style.setProperty("--font-size-base", `${settings.fontSize}px`);
        if (settings.highContrast) document.body.classList.add("high-contrast");
        if (settings.reducedMotion) document.body.classList.add("reduce-motion");
        const spacing = settings.messageSpacing ?? settings.spacing;
        if (spacing) document.body.classList.add(`spacing-${spacing}`);
        if (settings.saturation !== undefined && settings.saturation !== 100) {
          document.body.style.filter = `saturate(${settings.saturation}%)`;
        }
      }
    } catch {}
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <QuickSwitcher
        open={activeModal === "quickSwitcher"}
        onClose={closeModal}
      />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111720",
            border: "1px solid rgba(99, 179, 237, 0.15)",
            color: "#b8d4e8",
          },
        }}
      />
    </QueryClientProvider>
  );
}
