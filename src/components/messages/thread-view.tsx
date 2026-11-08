"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, EllipsisVertical, Flag, Phone, ShieldAlert, ShieldOff, User, Video } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { Lightbox, useLightbox } from "@/components/able/lightbox";
import type { OfferInput, SendInput } from "@/lib/schemas/message";
import {
  getThread,
  markRead,
  pollThread,
  sendMessage,
  setBlocked,
  setTyping,
  startCall,
  type Thread,
} from "@/server/messages";
import { Composer } from "./composer";
import { CallLayer, OfferDialog, ReportDialog } from "./dialogs";
import { MessageItem, type UiMessage } from "./message-item";
import { useLive } from "./use-live";

const dayKey = (iso: string) => new Date(iso).toDateString();

export function ThreadView({ initial, callsAvailable }: { initial: Thread; callsAvailable: boolean }) {
  const t = useTranslations("messages");
  const locale = useLocale();
  const [messages, setMessages] = React.useState<UiMessage[]>(initial.messages);
  const [hasMore, setHasMore] = React.useState(initial.hasMore);
  const [typing, setTypingState] = React.useState(initial.typing);
  const [blockedBy, setBlockedBy] = React.useState(initial.blockedBy);
  const [offer, setOffer] = React.useState<{ counterOf?: string; initial?: Partial<OfferInput> } | null>(
    null,
  );
  const [callUrl, setCallUrl] = React.useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = React.useState(false);
  const [report, setReport] = React.useState(false);
  const [announce, setAnnounce] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);
  const lb = useLightbox();
  const other = initial.other;
  const latest = React.useRef(initial.messages.at(-1)?.createdAt ?? new Date(0).toISOString());

  const atBottom = () => {
    const el = listRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };
  const toBottom = (smooth = true) =>
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" }),
    );

  React.useEffect(() => {
    toBottom(false);
    void markRead(initial.id);
  }, [initial.id]);

  const refresh = React.useCallback(async () => {
    const r = await pollThread(initial.id, latest.current).catch(() => null);
    if (!r) return;
    setTypingState(r.typing);
    if (r.blocked && !blockedBy) setBlockedBy("them");
    if (!r.blocked && blockedBy === "them") setBlockedBy(null);
    const stick = atBottom();
    setMessages((cur) => {
      let next = cur;
      const fresh = r.messages.filter((m) => !cur.some((c) => c.id === m.id));
      if (fresh.length) {
        next = [...cur, ...fresh];
        latest.current = fresh.at(-1)!.createdAt;
        const incoming = fresh.filter((m) => !m.mine);
        if (incoming.length) {
          setAnnounce(t("newMessage", { name: other.name }));
          if (document.visibilityState === "visible") void markRead(initial.id);
        }
      }
      const rec = new Map(r.receipts.map((x) => [x.id, x]));
      const offers = new Map(r.offers.map((x) => [x.id, x.offer]));
      return next.map((m) => {
        const x = rec.get(m.id);
        const o = offers.get(m.id);
        return x || o
          ? {
              ...m,
              ...(x ? { readAt: x.readAt, deliveredAt: x.deliveredAt } : {}),
              ...(o ? { offer: o } : {}),
            }
          : m;
      });
    });
    if (stick && r.messages.length) toBottom();
  }, [initial.id, blockedBy, other.name, t]);
  useLive(`able-convo-${initial.id}`, refresh, 5000);

  const loadOlder = async () => {
    const first = messages[0];
    if (!first) return;
    const r = await getThread(initial.id, first.createdAt);
    if (!r) return;
    const el = listRef.current;
    const h = el?.scrollHeight ?? 0;
    setMessages((cur) => [...r.messages, ...cur]);
    setHasMore(r.hasMore);
    requestAnimationFrame(() => el && (el.scrollTop = el.scrollHeight - h));
  };

  const send = async (input: SendInput, previews?: { src: string; type: string }[], retryId?: string) => {
    const tempId = retryId ?? `tmp-${Date.now()}`;
    const optimistic: UiMessage = {
      id: tempId,
      mine: true,
      kind: input.kind,
      text: "text" in input ? (input.text ?? null) : null,
      attachments:
        "attachments" in input
          ? input.attachments.map((a, i) => ({ ...a, src: previews?.[i]?.src ?? "" }))
          : [],
      offer: input.kind === "OFFER" ? { ...input.offer, status: "PENDING" } : null,
      callRoom: null,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      pending: true,
    };
    setMessages((cur) =>
      retryId ? cur.map((m) => (m.id === retryId ? optimistic : m)) : [...cur, optimistic],
    );
    toBottom();
    const r = await sendMessage(initial.id, input).catch(() => ({
      ok: false as const,
      error: "invalid" as const,
    }));
    if (r.ok) {
      latest.current = r.message.createdAt > latest.current ? r.message.createdAt : latest.current;
      setMessages((cur) => cur.map((m) => (m.id === tempId ? r.message : m)));
    } else {
      setMessages((cur) =>
        cur.map((m) =>
          m.id === tempId ? ({ ...m, pending: false, failed: true, retry: input } as UiMessage) : m,
        ),
      );
      if (r.error === "rate_limited") toast.error(t("slowDown"));
      if (r.error === "blocked") setBlockedBy("them");
    }
  };

  const call = async (video: boolean) => {
    if (!callsAvailable) return;
    const r = await startCall(initial.id, video);
    if (r.ok) setCallUrl(r.url);
    else toast.error(r.error === "blocked" ? t("blockedComposer") : t("callFailed"));
  };

  const callButton = (video: boolean) => {
    const label = video ? t("videoCall") : t("voiceCall");
    const icon = video ? <Video aria-hidden /> : <Phone aria-hidden />;
    if (callsAvailable)
      return (
        <IconButton aria-label={label} onClick={() => void call(video)} disabled={Boolean(blockedBy)}>
          {icon}
        </IconButton>
      );
    return (
      <Popover>
        <PopoverTrigger asChild>
          <IconButton aria-label={label}>{icon}</IconButton>
        </PopoverTrigger>
        <PopoverContent align="end" className="text-small text-graphite">
          <p className="text-ink mb-1 font-medium">{t("callsUnavailableTitle")}</p>
          {t("callsUnavailable")}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="bg-paper flex h-full min-h-0 flex-col max-md:fixed max-md:inset-0 max-md:z-[45]">
      <header className="border-line flex items-center gap-2 border-b px-2 pt-[max(8px,env(safe-area-inset-top))] pb-2 md:px-4 md:pt-3">
        <IconButton asChild aria-label={t("back")} className="lg:hidden">
          <Link href="/messages">
            <ArrowLeft aria-hidden />
          </Link>
        </IconButton>
        <Avatar src={other.image} name={other.name} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="text-body flex items-center gap-1.5 font-semibold">
            <span className="truncate">{other.name}</span>
            <VerifiedBadge tier={other.verifyTier} size={16} />
          </h1>
          <p className="text-caption text-graphite truncate" aria-live="polite">
            {typing ? t("typing") : other.kind === "org" ? t("employer") : t("talent")}
          </p>
        </div>
        {callButton(false)}
        {callButton(true)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton aria-label={t("more")}>
              <EllipsisVertical aria-hidden />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {other.href ? (
              <DropdownMenuItem asChild>
                <Link href={other.href}>
                  <User aria-hidden />
                  {t("viewProfile")}
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            {blockedBy === "me" ? (
              <DropdownMenuItem
                onSelect={async () => {
                  const r = await setBlocked(initial.id, false);
                  if (r.ok) setBlockedBy(null);
                }}
              >
                <ShieldOff aria-hidden />
                {t("unblock")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setConfirmBlock(true)}>
                <ShieldAlert aria-hidden />
                {t("block")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setReport(true)}>
              <Flag aria-hidden />
              {t("report")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6"
        role="log"
        aria-label={t("conversationWith", { name: other.name })}
      >
        {hasMore ? (
          <div className="mb-4 flex justify-center">
            <Button size="sm" variant="ghost" onClick={() => void loadOlder()}>
              {t("olderMessages")}
            </Button>
          </div>
        ) : null}
        {initial.safetyTip ? (
          <aside className="border-line bg-mist text-small mb-4 flex gap-3 rounded-[16px] border p-4">
            <ShieldAlert className="text-graphite mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{t("safetyTitle")}</p>
              <p className="text-graphite">{t("safetyBody")}</p>
            </div>
          </aside>
        ) : null}
        <ol className="flex flex-col gap-3">
          {messages.map((m, i) => {
            const newDay = i === 0 || dayKey(messages[i - 1]!.createdAt) !== dayKey(m.createdAt);
            return (
              <li key={m.id}>
                {newDay ? (
                  <p className="text-caption text-graphite my-2 text-center">
                    {new Date(m.createdAt).toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                ) : null}
                <MessageItem
                  m={m}
                  otherName={other.name}
                  canAct={!blockedBy}
                  onOpenImage={(imgs, idx, g) => lb.open(imgs, idx, g)}
                  onCounter={(om) => {
                    const o = om.offer as Partial<OfferInput> | null;
                    setOffer({
                      counterOf: om.id,
                      initial: {
                        role: o?.role,
                        pay: o?.pay,
                        currency: o?.currency,
                        period: o?.period,
                        startDate: o?.startDate,
                      },
                    });
                  }}
                  onJoinCall={(video) =>
                    void (callsAvailable
                      ? startCall(initial.id, video, m.id).then((r) =>
                          r.ok ? setCallUrl(r.url) : toast.error(t("callFailed")),
                        )
                      : toast.message(t("callsUnavailableTitle"), { description: t("callsUnavailable") }))
                  }
                  onRetry={(fm) => {
                    const retry = (fm as UiMessage & { retry?: SendInput }).retry;
                    if (retry) void send(retry, undefined, fm.id);
                  }}
                />
              </li>
            );
          })}
        </ol>
        {typing ? (
          <p className="text-caption text-graphite mt-3 flex items-center gap-1" aria-hidden>
            <span className="bg-graphite size-1.5 animate-bounce rounded-full" />
            <span className="bg-graphite size-1.5 animate-bounce rounded-full [animation-delay:120ms]" />
            <span className="bg-graphite size-1.5 animate-bounce rounded-full [animation-delay:240ms]" />
          </p>
        ) : null}
      </div>
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>

      <div className="border-line border-t px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-4">
        {blockedBy ? (
          <p className="text-small text-graphite py-2 text-center">
            {blockedBy === "me" ? t("youBlocked") : t("blockedComposer")}
          </p>
        ) : (
          <Composer
            conversationId={initial.id}
            disabled={Boolean(blockedBy)}
            onSend={(input, previews) => void send(input, previews)}
            onTyping={() => void setTyping(initial.id)}
            onOffer={() => setOffer({})}
          />
        )}
      </div>

      <OfferDialog
        open={Boolean(offer)}
        onOpenChange={(o) => !o && setOffer(null)}
        counter={Boolean(offer?.counterOf)}
        initial={offer?.initial}
        onSubmit={(o) => {
          const counterOf = offer?.counterOf;
          setOffer(null);
          void send({ kind: "OFFER", offer: o, ...(counterOf ? { counterOf } : {}) });
        }}
      />
      <ReportDialog open={report} onOpenChange={setReport} targetUserId={other.userId} name={other.name} />
      <ConfirmDialog
        open={confirmBlock}
        onOpenChange={setConfirmBlock}
        title={t("blockTitle", { name: other.name })}
        description={t("blockBody")}
        confirmLabel={t("block")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={async () => {
          const r = await setBlocked(initial.id, true);
          setConfirmBlock(false);
          if (r.ok) setBlockedBy("me");
        }}
      />
      <Lightbox lb={lb} closeLabel={t("close")} prevLabel={t("previous")} nextLabel={t("next")} />
      <CallLayer url={callUrl} title={t("callWith", { name: other.name })} onClose={() => setCallUrl(null)} />
    </div>
  );
}
