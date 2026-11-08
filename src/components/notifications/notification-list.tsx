"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  BadgeCheck,
  Bell,
  Handshake,
  Heart,
  MessageCircle,
  MessageSquare,
  Phone,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/able/empty-state";
import { useLive } from "@/components/messages/use-live";
import { cn } from "@/lib/utils";
import { listNotifications, markNotificationsRead, type NotificationView } from "@/server/social";

const icons: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  MESSAGE: MessageCircle,
  OFFER: Handshake,
  OFFER_ACCEPTED: Handshake,
  OFFER_DECLINED: X,
  CALL: Phone,
  FOLLOW: UserPlus,
  STAR: Star,
  REVIEW: Star,
  COMMENT: MessageSquare,
  LIKE: Heart,
  VERIFIED: BadgeCheck,
};

function href(n: NotificationView): string | null {
  const c = n.payload.conversationId;
  if (typeof c === "string") return `/messages/${c}`;
  if (["COMMENT", "LIKE", "REVIEW", "STAR", "FOLLOW"].includes(n.kind)) return "/me";
  return null;
}

/** In-app notifications (Stage 9), live via the same realtime nudge / polling as messages. */
export function NotificationList({ initial, meId }: { initial: NotificationView[]; meId: string }) {
  const t = useTranslations("notifications");
  const fmt = useFormatter();
  const [items, setItems] = React.useState(initial);
  const refresh = React.useCallback(async () => setItems(await listNotifications()), []);
  useLive(`able-user-${meId}`, refresh, 15_000);
  const unread = items.filter((i) => !i.read).length;

  if (!items.length) return <EmptyState icon={Bell} title={t("emptyTitle")} body={t("emptyBody")} />;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-graphite" aria-live="polite">
          {t("unread", { count: unread })}
        </p>
        {unread ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              setItems((xs) => xs.map((x) => ({ ...x, read: true })));
              await markNotificationsRead();
            }}
          >
            {t("markAll")}
          </Button>
        ) : null}
      </div>
      <ul className="border-line bg-raised divide-line divide-y overflow-hidden rounded-[20px] border">
        {items.map((n) => {
          const Icon = icons[n.kind] ?? Bell;
          const h = href(n);
          const name = String(n.payload.fromName ?? t("someone"));
          const body = (
            <>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  n.read ? "bg-mist text-graphite" : "bg-brand-soft text-brand",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("text-small", n.read ? "text-graphite" : "text-ink font-medium")}>
                  {t(`kinds.${n.kind as "MESSAGE"}`, { name })}
                </span>
                <time className="text-caption text-graphite" dateTime={n.createdAt}>
                  {fmt.relativeTime(new Date(n.createdAt))}
                </time>
              </span>
              {!n.read ? (
                <span className="bg-brand size-2.5 shrink-0 rounded-full">
                  <span className="sr-only">{t("new")}</span>
                </span>
              ) : null}
            </>
          );
          const cls = "flex min-h-16 items-center gap-3 px-4 py-3";
          return (
            <li key={n.id}>
              {h ? (
                <Link
                  href={h}
                  className={cn(cls, "hover:bg-mist/60")}
                  onClick={() => void markNotificationsRead([n.id])}
                >
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
