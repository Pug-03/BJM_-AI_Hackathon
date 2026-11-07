import * as React from "react";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: React.ReactNode;
}

/** Compact definition list of profile stats. */
export function StatRow({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-4", className)}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5 bg-paper px-4 py-3">
          <dt className="text-caption text-graphite">{s.label}</dt>
          <dd className="text-body font-semibold text-ink">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
