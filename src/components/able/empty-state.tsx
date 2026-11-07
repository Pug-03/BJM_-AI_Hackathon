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
        "bg-mist flex flex-col items-center gap-3 rounded-[20px] px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="bg-paper text-graphite flex size-12 items-center justify-center rounded-full">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <p className="text-body text-ink font-medium">{title}</p>
      {body ? <p className="measure text-small text-graphite">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
