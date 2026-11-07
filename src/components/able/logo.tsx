import { cn } from "@/lib/utils";

/** ABLE mark: an open ring with a rising dot — "a place that fits". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden fill="none">
      <rect width="32" height="32" rx="10" fill="var(--ink)" />
      <path
        d="M9.5 22.5 16 9l6.5 13.5"
        stroke="var(--paper)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19.4" r="2.2" fill="var(--brand)" />
    </svg>
  );
}

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {withWordmark ? (
        <span className="text-ink text-[1.1875rem] font-semibold tracking-[-0.01em]">ABLE</span>
      ) : null}
    </span>
  );
}
