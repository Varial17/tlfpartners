import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-bright/50 focus:ring-2 focus:ring-bright/20";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(base, "appearance-none pr-8 cursor-pointer", className)}
    {...props}
  />
));
Select.displayName = "Select";
