"use client";

import * as React from "react";
import { Checkbox as C } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof C.Root>,
  React.ComponentPropsWithoutRef<typeof C.Root>
>(({ className, ...props }, ref) => (
  <C.Root
    ref={ref}
    className={cn(
      "relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border border-graphite bg-paper transition-colors",
      "data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-paper",
      "before:absolute before:-inset-2.5 before:content-['']",
      className,
    )}
    {...props}
  >
    <C.Indicator>
      <Check className="size-4 stroke-[2.5]" aria-hidden />
    </C.Indicator>
  </C.Root>
));
Checkbox.displayName = "Checkbox";
