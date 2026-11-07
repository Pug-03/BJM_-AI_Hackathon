import * as React from "react";
import { cn } from "@/lib/utils";

export const inputBase = [
  "w-full rounded-[14px] border border-transparent bg-mist px-4 text-ink placeholder:text-muted",
  "transition-[border-color,background-color] duration-200 ease-smooth",
  "hover:bg-cloud focus:border-brand focus:bg-paper focus:outline-none focus-visible:outline-none",
  "aria-[invalid=true]:border-danger disabled:opacity-60",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(inputBase, "h-12", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(inputBase, "min-h-28 resize-y py-3 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";
