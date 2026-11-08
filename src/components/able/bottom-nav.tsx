"use client";

import * as React from "react";
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
  // Move the highlight on tap, before the next page has loaded.
  const [pending, setPending] = React.useState<string | null>(null);
  React.useEffect(() => setPending(null), [pathname]);
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
      <ul className="border-line bg-paper/95 shadow-float flex h-[var(--bottom-nav-h)] w-full max-w-sm items-center justify-around rounded-full border px-2 backdrop-blur-md">
        {items.map((it) => {
          const active = pending ? pending === it.href : isActive(pathname, it.href);
          const count = it.key === "messages" ? user?.unreadMessages : 0;
          return (
            <li key={it.key} className="flex h-full flex-1">
              {/* The whole slot is tappable; the highlight stays pill-sized. */}
              <Link
                href={it.href}
                aria-current={isActive(pathname, it.href) ? "page" : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  if (!isActive(pathname, it.href)) setPending(it.href);
                }}
                className={cn(
                  "group flex w-full items-center justify-center rounded-full text-[11px] font-medium [-webkit-tap-highlight-color:transparent]",
                  active ? "text-brand" : "text-graphite",
                )}
              >
                <span className="ease-smooth relative flex h-12 w-full max-w-24 flex-col items-center justify-center gap-0.5 transition-transform duration-150 group-active:scale-95">
                  {active ? (
                    <motion.span
                      layoutId="bottom-active"
                      aria-hidden
                      className="bg-brand-soft absolute inset-0 z-0 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  ) : null}
                  <it.icon className="relative z-10 size-[22px] stroke-[1.75]" aria-hidden />
                  <span className="relative z-10">{t(it.key)}</span>
                  {count ? (
                    <span className="bg-brand ring-paper absolute top-1.5 right-[calc(50%-18px)] z-10 size-2.5 rounded-full ring-2">
                      <span className="sr-only">({count})</span>
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
