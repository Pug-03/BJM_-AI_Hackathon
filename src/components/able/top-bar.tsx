"use client";

import { useTranslations } from "next-intl";
import { Bell, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { Logo } from "./logo";
import { LanguageSwitch } from "./language-switch";
import { ThemeSwitch } from "./theme-switch";
import type { ShellUser } from "./nav-items";

/** Mobile top bar (<768px): logo, search, notifications. */
export function TopBar({ user }: { user: ShellUser | null }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  return (
    <header className="border-line bg-paper/90 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
      <Link
        href={user ? "/feed" : "/"}
        aria-label={tb("home")}
        className="flex min-h-11 items-center rounded-lg"
      >
        <Logo />
      </Link>
      <div className="-mr-2 flex items-center">
        <IconButton asChild aria-label={t("searchTalent")}>
          <Link href="/explore">
            <Search aria-hidden />
          </Link>
        </IconButton>
        {user ? (
          <IconButton
            asChild
            aria-label={
              user.unreadNotifications
                ? `${t("notifications")} (${user.unreadNotifications})`
                : t("notifications")
            }
            className="relative"
          >
            <Link href="/notifications">
              <Bell aria-hidden />
              {user.unreadNotifications ? (
                <span
                  className="bg-brand ring-paper absolute top-2.5 right-2.5 size-2.5 rounded-full ring-2"
                  aria-hidden
                />
              ) : null}
            </Link>
          </IconButton>
        ) : (
          <>
            <LanguageSwitch />
            <ThemeSwitch />
          </>
        )}
      </div>
    </header>
  );
}
