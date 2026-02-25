import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton rounded-lg bg-surface", className)}
      style={style}
    />
  );
}

interface MessageSkeletonProps {
  delay?: number;
}

export function MessageSkeleton({ delay = 0 }: MessageSkeletonProps) {
  return (
    <div
      className="flex items-start gap-4 px-4 py-3 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {/* Avatar skeleton */}
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

      <div className="flex-1 space-y-2">
        {/* Username and timestamp */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>

        {/* Message content lines */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
          <Skeleton className="h-4 w-3/4 max-w-sm rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2.5 py-1.5 animate-fade-in"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
        >
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton
            className="h-4 rounded-md"
            style={{ width: `${50 + Math.random() * 30}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function MemberSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-2 py-1.5 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3.5 w-24 rounded-md" />
        <Skeleton className="h-2.5 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-0.5 px-2">
      <Skeleton className="mb-3 h-3 w-20 rounded-md" />
      {Array.from({ length: 6 }).map((_, i) => (
        <MemberSkeleton key={i} delay={i * 50} />
      ))}
    </div>
  );
}

export function GuildSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Skeleton
      className="h-12 w-12 rounded-3xl animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-4 w-4/6 rounded-md" />
      </div>
    </div>
  );
}

export function InputSkeleton() {
  return <Skeleton className="h-12 w-full rounded-xl" />;
}

export function ButtonSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return <Skeleton className={cn("rounded-xl", sizeClasses[size])} />;
}

// Full page loading skeleton
export function PageSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden animate-fade-in">
      {/* Guild sidebar skeleton */}
      <div className="flex w-[72px] flex-col items-center gap-2 bg-background-tertiary py-3">
        <GuildSkeleton />
        <div className="mx-auto h-[2px] w-8 rounded-full bg-surface-border" />
        {Array.from({ length: 4 }).map((_, i) => (
          <GuildSkeleton key={i} delay={(i + 1) * 100} />
        ))}
      </div>

      {/* Channel sidebar skeleton */}
      <div className="flex w-60 flex-col bg-background-secondary">
        <div className="h-12 border-b border-surface-border/50 px-4 flex items-center">
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <div className="flex-1 pt-4">
          <ChannelSkeleton />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col bg-background-primary">
        <div className="h-12 border-b border-surface-border/50 px-4 flex items-center">
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>
        <div className="flex-1 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MessageSkeleton key={i} delay={i * 100} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline loading spinner
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return <div className={cn("spinner-brand", sizeClasses[size], className)} />;
}

// Centered loading state
export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <div className="spinner-brand h-10 w-10" />
        <div className="absolute inset-0 animate-ping opacity-30">
          <div className="h-10 w-10 rounded-full bg-brand" />
        </div>
      </div>
      {message && (
        <p className="text-sm text-text-muted animate-pulse-soft">{message}</p>
      )}
    </div>
  );
}
