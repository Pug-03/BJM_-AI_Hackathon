"use client";

import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/** `compact`: icon-only below 640px (label stays as the accessible name). */
export function SignOutButton({ label, compact }: { label: string; compact?: boolean }) {
  const locale = useLocale();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await authClient.signOut();
        window.location.assign(`/${locale}`);
      }}
    >
      <LogOut aria-hidden />
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>{label}</span>
    </Button>
  );
}
