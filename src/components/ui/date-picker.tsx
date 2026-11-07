"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { inputBase } from "./input";

/**
 * Date picker built on the native date input: it gets the platform's accessible
 * picker on iOS/Android and full keyboard + screen reader support on desktop.
 */
export const DatePicker = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="date"
    className={cn(inputBase, "h-12 [color-scheme:inherit]", className)}
    {...props}
  />
));
DatePicker.displayName = "DatePicker";
