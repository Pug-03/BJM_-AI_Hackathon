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
            "z-50 max-w-64 rounded-xl bg-ink px-3 py-2 text-caption text-paper shadow-float",
            "data-[state=delayed-open]:animate-[able-fade_160ms_var(--ease-smooth)]",
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
