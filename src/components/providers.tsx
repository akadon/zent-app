"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { Toaster } from "sonner";
import { QuickSwitcher } from "./layout/quick-switcher";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { gateway } from "@/gateway/client";
import { usePresenceStore } from "@/stores/presence";

// Feature services
import { initMessageHandlers } from "@/features/messages/services/message-service";
import { initGuildHandlers } from "@/features/guilds/services/guild-service";
import { initRelationshipHandlers } from "@/features/friends/services/relationship-service";
import { initVoiceHandlers } from "@/features/voice/services/voice-service";

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
  const servicesInitialized = useRef(false);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Initialize gateway + all feature services when authenticated
  useEffect(() => {
    if (!token) return;
    if (servicesInitialized.current) return;
    servicesInitialized.current = true;

    gateway.connect(token);

    const cleanupPresence = usePresenceStore.getState().initPresenceHandlers();
    const cleanupGuild = initGuildHandlers();
    const cleanupMessages = initMessageHandlers(queryClient);
    const cleanupRelationships = initRelationshipHandlers(queryClient);
    const cleanupVoice = initVoiceHandlers();

    return () => {
      cleanupPresence();
      cleanupGuild();
      cleanupMessages();
      cleanupRelationships();
      cleanupVoice();
      gateway.disconnect();
      servicesInitialized.current = false;
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
