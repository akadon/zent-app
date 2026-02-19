"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer", disabled && "opacity-40 pointer-events-none")}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          checked ? "bg-brand" : "bg-background-active"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white",
            "transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
      {label && <span className="text-sm text-text-normal">{label}</span>}
    </label>
  );
}
