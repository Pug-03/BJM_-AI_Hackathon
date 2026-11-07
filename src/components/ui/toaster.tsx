"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

/** Sonner restyled to ABLE tokens. Toasts are announced via Sonner's built-in live region. */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme as "light" | "dark") ?? "light"}
      position="top-center"
      offset={16}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[20px] !border !border-line !bg-paper !text-ink !shadow-float !font-sans !text-small !gap-3 !px-4 !py-3",
          description: "!text-graphite",
          actionButton: "!rounded-full !bg-ink !text-paper",
          cancelButton: "!rounded-full !bg-mist !text-ink",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  );
}

export { toast } from "sonner";
