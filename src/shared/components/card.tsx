"use client";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "neon";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const variantClass =
    variant === "interactive" ? "card-interactive" :
    variant === "neon" ? "card-neon" : "card";

  return (
    <div className={cn(variantClass, className)} {...props}>
      {children}
    </div>
  );
}
