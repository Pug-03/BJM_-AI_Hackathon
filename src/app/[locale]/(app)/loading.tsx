import { Skeleton } from "@/components/ui/skeleton";

/** Shown while any app page loads (Stage 10: loading state on every route). */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-10 w-2/3 max-w-sm" />
      <Skeleton className="h-4 w-1/2 max-w-xs" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="h-40 rounded-[20px]" />
      </div>
    </div>
  );
}
