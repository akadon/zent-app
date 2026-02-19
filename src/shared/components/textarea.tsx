"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-wider text-header-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "input resize-none",
          error && "border-red/50 focus:border-red/50",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-light">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
