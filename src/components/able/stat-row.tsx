import * as React from "react";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: React.ReactNode;
}

/** Compact definition list of profile stats. */
export function StatRow({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl
      className={cn(
        "border-line bg-line grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border sm:grid-cols-4",
        className,
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="bg-paper flex flex-col gap-0.5 px-4 py-3">
          <dt className="text-caption text-graphite">{s.label}</dt>
          <dd className="text-body text-ink font-semibold">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
