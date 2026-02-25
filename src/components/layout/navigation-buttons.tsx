import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationButtonsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export function NavigationButtons({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          "rounded p-1",
          canGoBack
            ? "text-interactive-normal hover:text-interactive-hover"
            : "cursor-not-allowed text-text-muted/40"
        )}
        title="Go back"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className={cn(
          "rounded p-1",
          canGoForward
            ? "text-interactive-normal hover:text-interactive-hover"
            : "cursor-not-allowed text-text-muted/40"
        )}
        title="Go forward"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
