import { cn } from "@/lib/utils";

/**
 * Placeholder TLF stacked-circle mark + wordmark (PRD §9b).
 * Three overlapping roundels in navy / bright-blue / orange, then "TLF" and
 * a "PARTNERS" wordmark. Swap for the real asset when supplied.
 */
export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <circle cx="15" cy="14" r="11" fill="#19333A" />
        <circle cx="25" cy="14" r="11" fill="#116DFF" opacity="0.9" />
        <circle cx="20" cy="25" r="11" fill="#FAA61A" opacity="0.95" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-lg font-extrabold text-cream tracking-tight">
            TLF
          </div>
          <div className="text-[10px] font-semibold tracking-[0.25em] text-cream/70">
            PARTNERS
          </div>
        </div>
      )}
    </div>
  );
}
