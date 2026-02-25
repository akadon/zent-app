import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  gradient?: string;
}

const sizeClasses = {
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
  xl: "avatar-xl",
};

export function Avatar({ src, alt = "", fallback, size = "md", className, gradient }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "object-cover",
          sizeClasses[size],
          "rounded-xl",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "avatar",
        sizeClasses[size],
        gradient ? `bg-gradient-to-br ${gradient}` : "",
        className
      )}
    >
      {fallback?.[0]?.toUpperCase()}
    </div>
  );
}
