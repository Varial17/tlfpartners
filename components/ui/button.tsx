import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-orange text-navy hover:bg-orange-600 font-semibold shadow-sm",
  secondary:
    "bg-cream text-navy border border-navy/15 hover:border-navy/30",
  outline: "bg-transparent text-navy border border-navy/25 hover:bg-navy/5",
  ghost: "bg-transparent text-navy hover:bg-navy/5",
  danger: "bg-transparent text-red-600 border border-red-200 hover:bg-red-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-5 text-sm",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-bright/40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
