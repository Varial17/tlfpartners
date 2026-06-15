import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "navy"
  | "orange"
  | "blue"
  | "green"
  | "grey"
  | "red"
  | "amber";

const tones: Record<Tone, string> = {
  navy: "bg-navy text-cream",
  orange: "bg-orange/20 text-orange-600 border border-orange/30",
  blue: "bg-lightblue text-navy border border-bright/20",
  green: "bg-green-100 text-green-700 border border-green-200",
  grey: "bg-navy/5 text-muted border border-navy/10",
  red: "bg-red-100 text-red-700 border border-red-200",
  amber: "bg-amber-100 text-amber-700 border border-amber-200",
};

export function Badge({
  tone = "grey",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
