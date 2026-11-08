import { cn } from "@/lib/utils";

/**
 * ABLE mark: a formal monogram. The "A" doubles as a roof, with a person (warm dot)
 * sheltered underneath — a safe place to work. Navy for trust; legible at 16px.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden fill="none">
      <rect width="32" height="32" rx="8" fill="#1E40AF" />
      <path
        d="M8.6 24.4 16 7.6l7.4 16.8"
        stroke="#FFFFFF"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19.6" r="2.5" fill="#FFD3AE" />
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
