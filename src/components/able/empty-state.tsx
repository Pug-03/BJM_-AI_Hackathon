import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line bg-mist flex w-full flex-col items-center gap-3 rounded-[20px] border px-6 py-10 text-center md:py-14",
        className,
      )}
    >
      {Icon ? (
        <span className="border-line bg-paper text-graphite mb-1 flex size-14 items-center justify-center rounded-full border">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <p className="text-h3 text-ink">{title}</p>
      {body ? <p className="measure text-graphite">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
