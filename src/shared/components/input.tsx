"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-wider text-header-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "input",
          error && "border-red/50 focus:border-red/50",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-light">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
