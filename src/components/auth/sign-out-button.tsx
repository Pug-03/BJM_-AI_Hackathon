"use client";

import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ label }: { label: string }) {
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
      {label}
    </Button>
  );
}
