"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Two panes on desktop (≥1024px); one pane below, where the thread replaces the inbox. */
export function MessagesShell({ inbox, children }: { inbox: React.ReactNode; children: React.ReactNode }) {
  const t = useTranslations("messages");
  const inThread = /^\/messages\/.+/.test(usePathname());
  return (
    <div className="border-line md:bg-raised -mx-4 flex md:mx-0 md:h-[calc(100dvh-9rem)] md:min-h-[480px] md:overflow-hidden md:rounded-[20px] md:border">
      <section
        aria-label={t("inbox")}
        className={cn(
          "border-line flex w-full min-w-0 flex-col lg:w-[340px] lg:shrink-0 lg:border-r",
          inThread && "max-lg:hidden",
        )}
      >
        <h1 className="text-h2 tracking-display px-4 pt-2 pb-2 md:px-5 md:pt-5">{t("title")}</h1>
        <div className="min-h-0 flex-1 overflow-y-auto">{inbox}</div>
      </section>
      <div className={cn("min-w-0 flex-1", !inThread && "max-lg:hidden")}>{children}</div>
    </div>
  );
}
