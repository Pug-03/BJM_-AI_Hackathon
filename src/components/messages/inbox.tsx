"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { listConversations, type InboxItem } from "@/server/messages";
import { useLive } from "./use-live";

export function relTime(iso: string, locale: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days < 6) return d.toLocaleDateString(locale, { weekday: "short" });
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function Inbox({ initial, meId }: { initial: InboxItem[]; meId: string }) {
  const t = useTranslations("messages");
  const locale = useLocale();
  const pathname = usePathname();
  const [items, setItems] = React.useState(initial);
  const refresh = React.useCallback(async () => {
    const r = await listConversations().catch(() => null);
    if (r) setItems(r);
  }, []);
  useLive(`able-user-${meId}`, refresh, 10_000);
  React.useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  const preview = (i: InboxItem) => {
    const l = i.last;
    if (!l) return t("noMessagesYet");
    const prefix = l.mine ? `${t("you")}: ` : "";
    switch (l.kind) {
      case "TEXT":
        return prefix + (l.text ?? "");
      case "IMAGE":
        return prefix + t("previewImage");
      case "FILE":
        return prefix + t("previewFile");
      case "VOICE_NOTE":
        return prefix + t("previewVoice");
      case "OFFER":
        return prefix + t("previewOffer");
      case "CALL":
        return l.text === "VIDEO" ? t("previewVideoCall") : t("previewVoiceCall");
      default:
        return l.text === "OFFER_ACCEPTED"
          ? t("offerAccepted")
          : l.text === "OFFER_DECLINED"
            ? t("offerDeclined")
            : "";
    }
  };

  if (!items.length)
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="border-line bg-paper text-graphite flex size-14 items-center justify-center rounded-full border">
          <MessageCircle className="size-6" aria-hidden />
        </span>
        <p className="text-h3">{t("emptyTitle")}</p>
        <p className="text-small text-graphite measure">{t("emptyBody")}</p>
      </div>
    );

  return (
    <ul className="flex flex-col p-2" aria-label={t("conversations")}>
      {items.map((i) => {
        const active = pathname === `/messages/${i.id}`;
        return (
          <li key={i.id}>
            <Link
              href={`/messages/${i.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-[16px] px-3 py-3 transition-colors",
                active ? "bg-mist" : "hover:bg-mist/60",
              )}
            >
              <Avatar src={i.other.image} name={i.other.name} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5">
                  <span className={cn("truncate", i.unread ? "font-semibold" : "font-medium")}>
                    {i.other.name}
                  </span>
                  {/* Decorative here: the badge popover lives on profiles (no button inside a link). */}
                  <BadgeCheck className="text-brand size-3.5 shrink-0" aria-hidden />
                  {i.last ? (
                    <span className="text-caption text-graphite ml-auto shrink-0 pl-2">
                      {relTime(i.last.at, locale)}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("text-small truncate", i.unread ? "text-ink" : "text-graphite")}>
                    {i.blocked ? t("blockedPreview") : preview(i)}
                  </span>
                  {i.unread ? (
                    <span className="bg-brand ml-auto flex size-2.5 shrink-0 rounded-full">
                      <span className="sr-only">{t("unread", { count: i.unread })}</span>
                    </span>
                  ) : null}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
