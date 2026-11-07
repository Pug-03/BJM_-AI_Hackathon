"use client";

import * as React from "react";
import { Tooltip as T } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className={cn(
            "bg-ink text-caption text-paper shadow-float z-50 max-w-64 rounded-xl px-3 py-2",
            "data-[state=delayed-open]:animate-[able-fade_160ms_var(--ease-smooth)]",
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
