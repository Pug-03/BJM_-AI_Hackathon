"use client";

import * as React from "react";
import { Switch as S } from "radix-ui";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<
  React.ComponentRef<typeof S.Root>,
  React.ComponentPropsWithoutRef<typeof S.Root>
>(({ className, ...props }, ref) => (
  <S.Root
    ref={ref}
    className={cn(
      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200",
      "bg-cloud data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-50",
      "outline-offset-2 before:absolute before:-inset-2 before:content-['']",
      className,
    )}
    {...props}
  >
    <S.Thumb className="bg-paper ring-line ease-smooth pointer-events-none block size-6 translate-x-0.5 rounded-full shadow-sm ring-1 transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
  </S.Root>
));
Switch.displayName = "Switch";
