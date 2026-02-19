"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "brand" | "red" | "green" | "purple";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  brand: "badge-brand",
  red: "badge-red",
  green: "badge-green",
  purple: "badge-purple",
};

export function Badge({ variant = "brand", children, className }: BadgeProps) {
  return (
    <span className={cn(variantClasses[variant], className)}>
      {children}
    </span>
  );
}
