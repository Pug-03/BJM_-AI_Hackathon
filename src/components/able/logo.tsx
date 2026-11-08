import { cn } from "@/lib/utils";

/**
 * ABLE mark: a soft, rounded arch (a roof, a doorway) with a person inside —
 * "a place where you're welcome and safe". All curves, no sharp corners.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden fill="none">
      <rect width="32" height="32" rx="11" fill="var(--brand)" />
      <path d="M9.5 24.5v-8a6.5 6.5 0 0 1 13 0v8" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="16" cy="18.6" r="2.7" fill="#FFD9B8" />
      <path
        d="M13 24.4c.9-1.6 1.9-2.3 3-2.3s2.1.7 3 2.3"
        stroke="#FFD9B8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {withWordmark ? (
        <span className="text-ink text-[1.25rem] font-semibold tracking-[-0.005em]">ABLE</span>
      ) : null}
    </span>
  );
}
