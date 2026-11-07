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
    <div className={cn("flex flex-col items-center gap-3 rounded-[20px] bg-mist px-6 py-12 text-center", className)}>
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-paper text-graphite">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <p className="text-body font-medium text-ink">{title}</p>
      {body ? <p className="measure text-small text-graphite">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
