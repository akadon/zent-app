import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Sheet({ open, onClose, children, title }: SheetProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, handleEsc]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-e-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="sheet-backdrop absolute inset-0 animate-fade-in" />
      {/* Sheet */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "rounded-t-3xl",
          "bg-background-floating",
          "border-t border-surface-border",
          "shadow-e-4",
          "max-h-[85vh] overflow-y-auto",
          "animate-slide-up-sheet"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-text-muted/30" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-bold text-header-primary">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-background-hover hover:text-text-normal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}
