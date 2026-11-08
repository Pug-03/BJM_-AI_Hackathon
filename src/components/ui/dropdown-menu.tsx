"use client";

import * as React from "react";
import { DropdownMenu as M } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuGroup = M.Group;

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof M.Content>,
  React.ComponentPropsWithoutRef<typeof M.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <M.Portal>
    <M.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "border-line bg-paper text-ink shadow-float z-50 min-w-48 overflow-hidden rounded-[20px] border p-1.5",
        "origin-[var(--radix-dropdown-menu-content-transform-origin)] data-[state=open]:animate-[able-drop_220ms_var(--ease-smooth)]",
        className,
      )}
      {...props}
    />
  </M.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof M.Item>,
  React.ComponentPropsWithoutRef<typeof M.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <M.Item
    ref={ref}
    className={cn(
      "text-small flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] px-3 outline-none select-none",
      "data-[highlighted]:bg-brand-soft data-[highlighted]:text-brand data-[highlighted]:ring-brand data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:ring-2 data-[highlighted]:ring-inset",
      "[&_svg]:size-5 [&_svg]:stroke-[1.75]",
      destructive && "text-danger",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <M.Separator className={cn("bg-line my-1 h-px", className)} />
);

export const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof M.Label>) => (
  <M.Label className={cn("text-caption text-graphite px-3 py-2", className)} {...props} />
);

export const DropdownMenuRadioGroup = M.RadioGroup;
export const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof M.RadioItem>,
  React.ComponentPropsWithoutRef<typeof M.RadioItem>
>(({ className, children, ...props }, ref) => (
  <M.RadioItem
    ref={ref}
    className={cn(
      "text-small data-[highlighted]:bg-brand-soft data-[highlighted]:text-brand data-[highlighted]:ring-brand data-[state=checked]:text-brand flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[14px] px-3 outline-none select-none data-[highlighted]:ring-2 data-[highlighted]:ring-inset data-[state=checked]:font-medium",
      className,
    )}
    {...props}
  >
    {children}
    <M.ItemIndicator>
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </M.ItemIndicator>
  </M.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";
