"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Compass, LogIn } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isActive, mobileItems, type ShellUser } from "./nav-items";

/** Mobile floating pill bottom nav with safe-area inset (<768px). */
export function BottomNav({ user }: { user: ShellUser | null }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = user
    ? mobileItems.map((i) => (i.key === "profile" ? { ...i, href: user.profileHref } : i))
    : ([
        { key: "explore", href: "/explore", icon: Compass },
        { key: "login", href: "/login", icon: LogIn },
      ] as const);

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden"
    >
      <ul className="flex h-[var(--bottom-nav-h)] w-full max-w-sm items-center justify-around rounded-full border border-line bg-paper/95 px-2 shadow-float backdrop-blur-md">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          const count = it.key === "messages" ? user?.unreadMessages : 0;
          return (
            <li key={it.key} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative mx-auto flex h-12 max-w-24 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium",
                  active ? "text-brand" : "text-graphite",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="bottom-active"
                    className="absolute inset-0 rounded-full bg-brand-soft"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <it.icon className="relative size-[22px] stroke-[1.75]" aria-hidden />
                <span className="relative">{t(it.key)}</span>
                {count ? (
                  <span className="absolute top-1.5 right-[calc(50%-18px)] size-2.5 rounded-full bg-brand ring-2 ring-paper">
                    <span className="sr-only">({count})</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
