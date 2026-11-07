"use client";

import * as React from "react";
import { Popover as P } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof P.Content>,
  React.ComponentPropsWithoutRef<typeof P.Content>
>(({ className, sideOffset = 8, align = "start", ...props }, ref) => (
  <P.Portal>
    <P.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      collisionPadding={16}
      className={cn(
        "z-50 w-72 max-w-[calc(100vw-32px)] rounded-[20px] border border-line bg-paper p-4 text-ink shadow-float focus:outline-none",
        "data-[state=open]:animate-[able-drop_220ms_var(--ease-smooth)]",
        className,
      )}
      {...props}
    />
  </P.Portal>
));
PopoverContent.displayName = "PopoverContent";
