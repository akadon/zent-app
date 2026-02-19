"use client";

import { cn } from "@/lib/utils";

interface DividerProps {
  vertical?: boolean;
  className?: string;
}

export function Divider({ vertical, className }: DividerProps) {
  return <div className={cn(vertical ? "divider-vertical" : "divider", className)} />;
}
