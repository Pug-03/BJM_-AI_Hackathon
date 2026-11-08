import { cn } from "@/lib/utils";

/**
 * ABLE mark (from the owner's artwork): a soft, rounded house, half violet and half peach,
 * with two people side by side — "a safe place, and people who have your back".
 * Simplified to stay legible at 16–32px.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden fill="none">
      <defs>
        <clipPath id="able-l">
          <path d="M0 0h16.4c-1 4-1 7.6.2 11.2 1 3.2.4 6.4-.6 9.2-.6 1.8-.6 6.2-.2 11.6H0z" />
        </clipPath>
        <clipPath id="able-r">
          <path d="M32 0H16.4c-1 4-1 7.6.2 11.2 1 3.2.4 6.4-.6 9.2-.6 1.8-.6 6.2-.2 11.6H32z" />
        </clipPath>
      </defs>
      <g strokeLinejoin="round">
        <path
          d="M16 4.2 5 13v12.4A2.6 2.6 0 0 0 7.6 28h16.8a2.6 2.6 0 0 0 2.6-2.6V13z"
          fill="#6D28FF"
          stroke="#6D28FF"
          strokeWidth="3.6"
          clipPath="url(#able-l)"
        />
        <path
          d="M16 4.2 5 13v12.4A2.6 2.6 0 0 0 7.6 28h16.8a2.6 2.6 0 0 0 2.6-2.6V13z"
          fill="#FFD3AE"
          stroke="#FFD3AE"
          strokeWidth="3.6"
          clipPath="url(#able-r)"
        />
      </g>
      <circle cx="10.6" cy="15.6" r="2.6" fill="#FFFFFF" />
      <path d="M6.8 25.4a3.8 3.8 0 0 1 7.6 0z" fill="#FFFFFF" />
      <circle cx="21.4" cy="15.6" r="2.6" fill="#6D28FF" />
      <path d="M17.6 25.4a3.8 3.8 0 0 1 7.6 0z" fill="#6D28FF" />
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
