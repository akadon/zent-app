"use client";

import { useAuthStore } from "@/stores/auth";
import { AuthPage } from "@/components/auth/auth-page";
import { ResponsiveProvider } from "@/layouts/responsive-provider";

export default function Home() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <ResponsiveProvider />;
}
