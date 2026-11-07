"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";
import { LanguageSwitch } from "./language-switch";
import { ThemeSwitch } from "./theme-switch";
import { isActive, railItems, settingsItem, type ShellUser } from "./nav-items";

/** Desktop/tablet slim left icon rail (≥768px). */
export function IconRail({ user }: { user: ShellUser | null }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const pathname = usePathname();
  const items = user ? railItems : railItems.filter((i) => i.key === "explore");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--rail-w)] flex-col items-center border-r border-line bg-paper py-4 md:flex">
      <Link href={user ? "/feed" : "/"} aria-label={tb("home")} className="mb-6 rounded-[10px]">
        <LogoMark className="size-9" />
      </Link>
      <nav aria-label={t("main")} className="flex flex-1 flex-col items-center gap-1">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          const count =
            it.key === "messages" ? user?.unreadMessages : it.key === "notifications" ? user?.unreadNotifications : 0;
          return (
            <Tooltip key={it.key} content={t(it.key)} side="right">
              <Link
                href={it.href}
                aria-label={count ? `${t(it.key)} (${count})` : t(it.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-2xl transition-colors",
                  active ? "text-brand" : "text-graphite hover:bg-mist hover:text-ink",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-2xl bg-brand-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <it.icon className="relative size-[22px] stroke-[1.75]" aria-hidden />
                {count ? (
                  <span className="absolute top-2 right-2 size-2.5 rounded-full bg-brand ring-2 ring-paper" aria-hidden />
                ) : null}
              </Link>
            </Tooltip>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-1">
        <LanguageSwitch side="right" />
        <ThemeSwitch side="right" />
        {user ? (
          <>
            <Tooltip content={t(settingsItem.key)} side="right">
              <Link
                href={settingsItem.href}
                aria-label={t(settingsItem.key)}
                aria-current={isActive(pathname, settingsItem.href) ? "page" : undefined}
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl",
                  isActive(pathname, settingsItem.href) ? "bg-brand-soft text-brand" : "text-graphite hover:bg-mist hover:text-ink",
                )}
              >
                <settingsItem.icon className="size-[22px] stroke-[1.75]" aria-hidden />
              </Link>
            </Tooltip>
            <Link href={user.profileHref} aria-label={t("myProfile")} className="mt-2 rounded-full">
              <Avatar src={user.image} name={user.name} size="sm" />
            </Link>
          </>
        ) : (
          <Tooltip content={t("login")} side="right">
            <Link href="/login" aria-label={t("login")} className="mt-2 flex size-12 items-center justify-center rounded-2xl bg-ink text-paper">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
