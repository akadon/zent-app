import { cn } from "@/lib/utils";

interface ZentLogoProps {
  className?: string;
}

export function ZentLogo({ className }: ZentLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-5", className)}>
      <path
        d="M6 5h12a1 1 0 011 1v1a1 1 0 01-.293.707L9.414 17H18a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1a1 1 0 01.293-.707L14.586 7H6a1 1 0 01-1-1V5a1 1 0 011-1z"
        fill="currentColor"
      />
      <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
