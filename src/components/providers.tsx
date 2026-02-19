"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { Toaster } from "sonner";
import { QuickSwitcher } from "./layout/quick-switcher";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

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

  useEffect(() => {
    loadSession();
  }, [loadSession]);

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
            background: "#111214",
            border: "1px solid #2b2d31",
            color: "#dbdee1",
          },
        }}
      />
    </QueryClientProvider>
  );
}
