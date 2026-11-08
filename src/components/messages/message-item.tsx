"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  CheckCheck,
  Clock,
  FileText,
  Languages,
  Pause,
  Phone,
  Play,
  Video,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { useAi } from "@/components/ai/ai-provider";
import { errKey } from "@/components/ai/mic-button";
import { transcribe } from "@/components/ai/use-recorder";
import { cn } from "@/lib/utils";
import { respondOffer, translateMessage, type ChatMessage } from "@/server/messages";

export type UiMessage = ChatMessage & { pending?: boolean; failed?: boolean };

const time = (iso: string, locale: string) =>
  new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });

export function MessageItem({
  m,
  otherName,
  onOpenImage,
  onCounter,
  onJoinCall,
  onRetry,
  canAct,
}: {
  m: UiMessage;
  otherName: string;
  onOpenImage: (images: { src: string; alt: string }[], index: number, group: string) => void;
  onCounter: (m: UiMessage) => void;
  onJoinCall: (video: boolean) => void;
  onRetry: (m: UiMessage) => void;
  canAct: boolean;
}) {
  const t = useTranslations("messages");
  const locale = useLocale();

  if (m.kind === "SYSTEM")
    return (
      <p className="text-caption text-graphite py-1 text-center">
        {m.text === "OFFER_ACCEPTED"
          ? t("offerAcceptedBy", { name: m.mine ? t("you") : otherName })
          : m.text === "OFFER_DECLINED"
            ? t("offerDeclinedBy", { name: m.mine ? t("you") : otherName })
            : m.text}
      </p>
    );

  const status = m.mine ? (
    <span className="inline-flex items-center gap-1">
      {m.failed ? (
        <>
          <AlertCircle className="text-danger size-3.5" aria-hidden />
          <span className="text-danger">{t("notSent")}</span>
        </>
      ) : m.pending ? (
        <>
          <Clock className="size-3.5" aria-hidden />
          <span className="sr-only">{t("sending")}</span>
        </>
      ) : m.readAt ? (
        <>
          <CheckCheck className="text-brand size-3.5" aria-hidden />
          <span className="sr-only">{t("read")}</span>
        </>
      ) : m.deliveredAt ? (
        <>
          <CheckCheck className="size-3.5" aria-hidden />
          <span className="sr-only">{t("delivered")}</span>
        </>
      ) : (
        <>
          <Check className="size-3.5" aria-hidden />
          <span className="sr-only">{t("sent")}</span>
        </>
      )}
    </span>
  ) : null;

  const meta = (
    <p
      className={cn("text-caption text-graphite mt-1 flex items-center gap-1.5", m.mine ? "justify-end" : "")}
    >
      <time dateTime={m.createdAt}>{time(m.createdAt, locale)}</time>
      {status}
      {m.failed ? (
        <button type="button" className="text-ink underline underline-offset-4" onClick={() => onRetry(m)}>
          {t("retry")}
        </button>
      ) : null}
    </p>
  );

  const wrap = (children: React.ReactNode, withMeta = true) => (
    <div className={cn("flex flex-col gap-1", m.mine ? "items-end" : "items-start")}>
      <div className="max-w-[min(85%,520px)]">{children}</div>
      {withMeta ? meta : null}
    </div>
  );

  if (m.kind === "OFFER" && m.offer)
    return wrap(<OfferCard m={m} canAct={canAct} onCounter={() => onCounter(m)} />);
  if (m.kind === "CALL") {
    const video = m.text === "VIDEO";
    const recent = Date.now() - new Date(m.createdAt).getTime() < 2 * 60 * 60 * 1000;
    return wrap(
      <div className="border-line bg-raised flex items-center gap-3 rounded-[20px] border p-4">
        <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-full">
          {video ? <Video className="size-5" aria-hidden /> : <Phone className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium">{video ? t("videoCall") : t("voiceCall")}</p>
          <p className="text-caption text-graphite">
            {m.mine ? t("youStartedCall") : t("startedCall", { name: otherName })}
          </p>
        </div>
        {recent && canAct ? (
          <Button size="sm" onClick={() => onJoinCall(video)}>
            {t("join")}
          </Button>
        ) : null}
      </div>,
    );
  }

  const images = m.attachments.filter((a) => a.type.startsWith("image/"));
  const files = m.attachments.filter((a) => !a.type.startsWith("image/") && !a.type.startsWith("audio/"));
  const audio = m.attachments.find((a) => a.type.startsWith("audio/"));
  return wrap(
    <div className={cn("flex flex-col gap-2", m.mine ? "items-end" : "items-start")}>
      {images.length ? (
        <div className={cn("grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {images.map((a, i) => (
            <button
              key={a.url}
              type="button"
              onClick={() =>
                onOpenImage(
                  images.map((x) => ({
                    src: x.src,
                    alt: x.alt || t("imageFrom", { name: m.mine ? t("you") : otherName }),
                  })),
                  i,
                  `img-${m.id}`,
                )
              }
              className="overflow-hidden rounded-[16px]"
              aria-label={t("openImage", { n: i + 1 })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.src} alt={a.alt ?? ""} className="max-h-72 w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
      {files.map((a) => (
        <a
          key={a.url}
          href={a.src}
          target="_blank"
          rel="noopener"
          className="border-line bg-raised hover:bg-mist flex min-h-14 items-center gap-3 rounded-[16px] border px-4 py-3"
        >
          <FileText className="text-graphite size-5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="text-small block truncate font-medium">{a.name ?? t("file")}</span>
            {a.size ? (
              <span className="text-caption text-graphite">{Math.ceil(a.size / 1024)} KB</span>
            ) : null}
          </span>
        </a>
      ))}
      {audio ? <VoiceNote src={audio.src} durationMs={audio.durationMs} mine={m.mine} /> : null}
      {m.text ? <TextBubble m={m} meta={meta} /> : null}
    </div>,
    !m.text,
  );
}

function TextBubble({ m, meta }: { m: UiMessage; meta: React.ReactNode }) {
  const t = useTranslations("messages");
  const ta = useTranslations("ai");
  const ai = useAi();
  const [tr, setTr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  // Thai text translates to English; anything else to Thai.
  const target = /[฀-๿]/.test(m.text ?? "") ? "en" : "th";
  const translate = async () => {
    if (tr) return setTr(null);
    if (!ai.text)
      return toast.message(ta("textUnavailableTitle"), { description: t("translateUnavailable") });
    if (!(await ai.ensureConsent())) return;
    setBusy(true);
    const r = await translateMessage(m.id, target);
    setBusy(false);
    if (r.ok) setTr(r.translation);
    else toast.error(ta(`errors.${errKey(r.error)}`));
  };
  return (
    <div className={cn("flex flex-col gap-1", m.mine ? "items-end" : "items-start")}>
      <p
        className={cn(
          "text-body rounded-[20px] px-4 py-2.5 break-words whitespace-pre-wrap",
          m.mine
            ? "bg-ink text-paper dark:bg-avatar dark:text-ink rounded-br-md"
            : "bg-mist text-ink rounded-bl-md",
        )}
      >
        {m.text}
      </p>
      {tr ? (
        <div className="border-line max-w-full rounded-[16px] border px-4 py-2.5">
          <p className="text-caption text-brand mb-1 font-medium">{t("translatedByAi")}</p>
          <p className="text-small text-ink whitespace-pre-wrap" lang={target}>
            {tr}
          </p>
        </div>
      ) : null}
      <div className={cn("flex items-center gap-2", m.mine ? "flex-row-reverse" : "")}>
        {meta}
        {!m.mine && !m.pending ? (
          <button
            type="button"
            onClick={() => void translate()}
            aria-busy={busy || undefined}
            className="text-caption text-graphite hover:text-ink inline-flex min-h-8 items-center gap-1 rounded-full px-1"
          >
            <Languages className="size-3.5" aria-hidden />
            {busy ? t("translating") : tr ? t("showOriginalOnly") : t("translate")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function VoiceNote(props: { src: string; durationMs?: number; mine: boolean }) {
  const t = useTranslations("messages");
  const ta = useTranslations("ai");
  const ai = useAi();
  const [text, setText] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const show = async () => {
    if (text) return setText(null);
    if (!ai.speech)
      return toast.message(ta("speechUnavailableTitle"), { description: t("voiceTextUnavailable") });
    if (!(await ai.ensureConsent())) return;
    setBusy(true);
    const blob = await fetch(props.src)
      .then((r) => r.blob())
      .catch(() => null);
    const r = blob ? await transcribe(blob) : { error: "failed" };
    setBusy(false);
    if ("text" in r && r.text) setText(r.text);
    else toast.error(ta(`errors.${"error" in r ? errKey(r.error) : "empty"}`));
  };
  return (
    <div className={cn("flex flex-col gap-1", props.mine ? "items-end" : "items-start")}>
      <VoicePlayer {...props} />
      {text ? (
        <p className="border-line text-small max-w-64 rounded-[16px] border px-3 py-2">
          <span className="text-caption text-brand block font-medium">{t("transcribedByAi")}</span>
          {text}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void show()}
        aria-busy={busy || undefined}
        className="text-caption text-graphite hover:text-ink inline-flex min-h-8 items-center gap-1 rounded-full px-1"
      >
        {busy ? t("transcribing") : text ? t("hideText") : t("showAsText")}
      </button>
    </div>
  );
}

function VoicePlayer({ src, durationMs, mine }: { src: string; durationMs?: number; mine: boolean }) {
  const t = useTranslations("messages");
  const ref = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const secs = Math.round((durationMs ?? 0) / 1000);
  return (
    <div
      className={cn(
        "flex w-64 max-w-full items-center gap-3 rounded-[20px] px-3 py-2",
        mine ? "bg-ink text-paper" : "bg-mist text-ink",
      )}
    >
      <button
        type="button"
        aria-label={playing ? t("pauseVoice") : t("playVoice")}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) void a.play();
          else a.pause();
        }}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          mine ? "bg-paper text-ink" : "bg-ink text-paper",
        )}
      >
        {playing ? (
          <Pause className="size-4" aria-hidden fill="currentColor" />
        ) : (
          <Play className="size-4" aria-hidden fill="currentColor" />
        )}
      </button>
      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-current/25" aria-hidden>
        <span
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-current"
          style={{ transform: `scaleX(${progress})` }}
        />
      </span>
      <span className="text-caption tabular-nums">{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</span>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- user voice notes have no caption track; "Show as text" below transcribes on request */}
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration && Number.isFinite(a.duration)) setProgress(a.currentTime / a.duration);
        }}
      />
    </div>
  );
}

function OfferCard({ m, canAct, onCounter }: { m: UiMessage; canAct: boolean; onCounter: () => void }) {
  const t = useTranslations("messages");
  const locale = useLocale();
  const o = m.offer as {
    role: string;
    pay: number;
    currency: string;
    period: string;
    startDate?: string | null;
    notes?: string;
    status?: string;
  };
  const [status, setStatus] = React.useState(o.status ?? "PENDING");
  React.useEffect(() => setStatus(o.status ?? "PENDING"), [o.status]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const pay = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: o.currency,
    maximumFractionDigits: 0,
  }).format(o.pay);
  const act = async (a: "ACCEPTED" | "DECLINED") => {
    setBusy(a);
    const r = await respondOffer(m.id, a);
    setBusy(null);
    if (r.ok) setStatus(a);
    else toast.error(t("offerFailed"));
  };
  const badge: Record<string, string> = {
    PENDING: "bg-mist text-ink",
    ACCEPTED: "bg-success/15 text-success",
    DECLINED: "bg-danger/10 text-danger",
    COUNTERED: "bg-mist text-graphite",
  };
  return (
    <article
      className="border-line bg-raised flex w-80 max-w-full flex-col gap-3 rounded-[20px] border p-4"
      aria-label={t("offer")}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-graphite">{m.mine ? t("offerSent") : t("offerReceived")}</p>
        <span
          className={cn(
            "text-caption rounded-full px-2.5 py-0.5 font-medium",
            badge[status] ?? badge.PENDING,
          )}
        >
          {t(`offerStatus.${status as "PENDING"}`)}
        </span>
      </div>
      <p className="text-h3">{o.role}</p>
      <dl className="text-small grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-graphite">{t("offerPay")}</dt>
        <dd className="font-medium">
          {pay} / {t(`period.${o.period as "MONTH"}`)}
        </dd>
        {o.startDate ? (
          <>
            <dt className="text-graphite">{t("offerStart")}</dt>
            <dd>
              {new Date(o.startDate).toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </>
        ) : null}
      </dl>
      {o.notes ? <p className="text-small text-graphite whitespace-pre-wrap">{o.notes}</p> : null}
      {!m.mine && status === "PENDING" && canAct ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" loading={busy === "ACCEPTED"} onClick={() => void act("ACCEPTED")}>
            {t("accept")}
          </Button>
          <Button size="sm" variant="secondary" onClick={onCounter}>
            {t("counter")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            loading={busy === "DECLINED"}
            onClick={() => void act("DECLINED")}
          >
            {t("decline")}
          </Button>
        </div>
      ) : null}
      <p className="text-caption text-graphite">{t("offerNote")}</p>
    </article>
  );
}
