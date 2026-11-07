"use client";

import { useLocale, useTranslations } from "next-intl";
import { LogOut, Settings, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShellUser } from "./nav-items";

export function AccountMenu({ user }: { user: ShellUser }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const logout = async () => {
    await authClient.signOut();
    window.location.assign(`/${locale}`);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t("account")} className="mt-2 rounded-full">
          <span aria-hidden className="inline-flex">
            <Avatar src={user.image} name={user.name} size="sm" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end">
        {user.name ? <DropdownMenuLabel>{user.name}</DropdownMenuLabel> : null}
        <DropdownMenuItem asChild>
          <Link href={user.profileHref}>
            <User aria-hidden />
            {t("myProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut aria-hidden />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
