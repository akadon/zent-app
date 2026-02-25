import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tooltip, active, size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex items-center justify-center rounded-xl",
        "transition-all duration-200",
        sizeClasses[size],
        active
          ? "bg-brand/15 text-brand-light"
          : "text-text-muted hover:bg-background-hover hover:text-text-normal",
        "active:scale-90",
        className
      )}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = "IconButton";
