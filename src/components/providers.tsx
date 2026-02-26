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
import { initGuildService } from "@/features/guilds/services/guild-service";
import { gateway } from "@/gateway/client";

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

  // Connect gateway + register event handlers
  useEffect(() => {
    if (!token) {
      if (initialized.current) {
        gateway.disconnect();
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

    // Handle READY event from gateway (initial state)
    const cleanupReady = gateway.on("READY", (data: any) => {
      const channelsMap = new Map<string, Channel[]>();
      const membersMap = new Map<string, Member[]>();

      for (const guild of data.guilds ?? []) {
        if (guild.channels) channelsMap.set(guild.id, guild.channels);
        if (guild.members) membersMap.set(guild.id, guild.members);
      }

      useGuildStore.setState({
        guilds: data.guilds ?? [],
        channels: channelsMap,
        members: membersMap,
      });

      // Hydrate presence
      const presenceEntries: Array<{
        userId: string;
        data: { status: "online" | "idle" | "dnd" | "offline"; customStatus: { text?: string; emoji?: string } | null };
      }> = [];

      for (const guild of data.guilds ?? []) {
        for (const member of guild.members ?? []) {
          const user = member.user as any;
          if (user?.status && user.status !== "offline") {
            presenceEntries.push({
              userId: user.id,
              data: { status: user.status, customStatus: user.customStatus ?? null },
            });
          }
        }
      }
      if (presenceEntries.length > 0) {
        usePresenceStore.getState().bulkSetPresences(presenceEntries);
      }

      useUIStore.getState().setConnectionStatus("connected");
    });

    // Register all event handlers
    const stopGuildService = initGuildService(queryClient);

    // Connect
    gateway.connect(token);

    return () => {
      cleanupReady();
      stopGuildService();
      gateway.disconnect();
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
