"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Check, MapPin, MessageCircle, Sparkles, Star, UserPlus, UserCheck, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { provinceLabel } from "@/config/th-provinces";
import { normSkill } from "@/lib/match";
import { cn } from "@/lib/utils";
import type { MatchCardData } from "@/server/feed";

/**
 * MatchCard (section 7.7). Matched skills are highlighted with brand-soft + a check (never
 * colour alone). Swipe right to star / left to skip on touch screens — buttons do the same.
 */
export function MatchCard({
  c,
  reason,
  reasonLoading,
  onStar,
  onFollow,
  onMessage,
  onSkip,
  swipe,
  sampleLabel,
}: {
  c: MatchCardData;
  reason: string | null;
  reasonLoading: boolean;
  onStar: () => void;
  onFollow: () => void;
  onMessage: () => void;
  onSkip: () => void;
  swipe: boolean;
  sampleLabel: boolean;
}) {
  const t = useTranslations("feed");
  const te = useTranslations("enums");
  const ta = useTranslations("ai");
  const locale = useLocale();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-4, 0, 4]);
  const starHint = useTransform(x, [40, 120], [0, 1]);
  const skipHint = useTransform(x, [-120, -40], [1, 0]);
  const matched = new Set(c.matched.map(normSkill));
  const isMatched = (s: string) => {
    const n = normSkill(s);
    return [...matched].some((m) => m === n || ` ${n} `.includes(` ${m} `) || ` ${m} `.includes(` ${n} `));
  };
  const skills = [...c.skills].sort((a, b) => Number(isMatched(b)) - Number(isMatched(a))).slice(0, 6);
  const extra = c.skills.length - skills.length;
  const fallback = buildFallback(c, t, te);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) onStar();
    else if (info.offset.x < -120) onSkip();
  };

  return (
    <motion.article
      aria-labelledby={`mc-${c.talentId}`}
      drag={swipe ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={onDragEnd}
      style={swipe ? { x, rotate } : undefined}
      className="border-line bg-raised relative overflow-hidden rounded-[20px] border"
    >
      {swipe ? (
        <>
          <motion.span
            aria-hidden
            style={{ opacity: starHint }}
            className="bg-brand text-caption pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 font-medium text-white"
          >
            <Star className="size-3.5" fill="currentColor" /> {t("star")}
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: skipHint }}
            className="bg-ink text-paper text-caption pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 font-medium"
          >
            <X className="size-3.5" /> {t("skip")}
          </motion.span>
        </>
      ) : null}
      <div className="bg-mist h-16 sm:h-20">
        {c.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.cover}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover dark:brightness-75 dark:saturate-75"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-4 px-5 pb-5">
        <div className="-mt-8 flex items-end justify-between gap-3">
          <Avatar src={c.avatar} name={c.name} size="lg" className="border-raised border-4" />
          {sampleLabel && c.sample ? (
            <span className="bg-mist text-caption text-graphite rounded-full px-2.5 py-0.5">
              {t("sample")}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <h2 id={`mc-${c.talentId}`} className="text-h3 flex items-center gap-1.5">
            <Link href={`/u/${c.handle}`} className="hover:underline focus-visible:underline">
              {c.name}
            </Link>
            <VerifiedBadge tier={c.verifyTier} />
          </h2>
          {c.headline ? <p className="text-small text-ink">{c.headline}</p> : null}
          <p className="text-caption text-graphite flex flex-wrap items-center gap-x-2 gap-y-1">
            {c.province ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden />
                {provinceLabel(c.province, locale)}
              </span>
            ) : null}
            <span>{te(`workMode.${c.workMode}`)}</span>
            {c.ratingCount ? (
              <span className="inline-flex items-center gap-1">
                <Star className="text-star size-3.5" fill="currentColor" strokeWidth={0} aria-hidden />
                <span className="text-ink font-medium">{c.rating.toFixed(1)}</span>
                <span>({c.ratingCount})</span>
              </span>
            ) : null}
          </p>
        </div>
        {skills.length ? (
          <ul className="flex flex-wrap gap-2" aria-label={t("skills")}>
            {skills.map((s) => {
              const m = isMatched(s);
              return (
                <li
                  key={s}
                  className={cn(
                    "text-small inline-flex h-8 items-center gap-1 rounded-full px-3",
                    m ? "bg-brand-soft text-brand font-medium" : "bg-mist text-ink",
                  )}
                >
                  {m ? <Check className="size-3.5" aria-hidden /> : null}
                  {s}
                  {m ? <span className="sr-only"> ({t("matchedSkill")})</span> : null}
                </li>
              );
            })}
            {extra > 0 ? (
              <li className="text-small text-graphite inline-flex h-8 items-center px-1">+{extra}</li>
            ) : null}
          </ul>
        ) : null}
        <div className="bg-mist rounded-[14px] px-4 py-3">
          <p className="text-caption text-graphite mb-1 flex items-center gap-1.5">
            {t("whyMatch")}
            {reason ? (
              <span className="text-brand inline-flex items-center gap-1 font-medium">
                · <Sparkles className="size-3" aria-hidden />
                {ta("suggestion")}
              </span>
            ) : null}
          </p>
          {reasonLoading && !reason ? (
            <Skeleton className="h-4 w-4/5" />
          ) : (
            <p className="text-small text-ink">{reason ?? fallback}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={onMessage} className="flex-1 sm:flex-none">
            <MessageCircle aria-hidden />
            {t("message")}
          </Button>
          <Tooltip content={c.starred ? t("unstar") : t("star")}>
            <IconButton
              variant={c.starred ? "brand" : "soft"}
              aria-label={c.starred ? t("unstar") : t("star")}
              aria-pressed={c.starred}
              onClick={onStar}
            >
              <Star aria-hidden fill={c.starred ? "currentColor" : "none"} />
            </IconButton>
          </Tooltip>
          <Tooltip content={c.following ? t("unfollow") : t("follow")}>
            <IconButton
              variant="soft"
              aria-label={c.following ? t("unfollow") : t("follow")}
              aria-pressed={c.following}
              onClick={onFollow}
            >
              {c.following ? <UserCheck aria-hidden /> : <UserPlus aria-hidden />}
            </IconButton>
          </Tooltip>
          <Button type="button" variant="ghost" className="ml-auto" onClick={onSkip}>
            {t("skip")}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

/** Non-AI summary from the computed match (shown until/unless an AI line is available). */
function buildFallback(
  c: MatchCardData,
  t: ReturnType<typeof useTranslations<"feed">>,
  te: ReturnType<typeof useTranslations<"enums">>,
) {
  const parts: string[] = [];
  if (c.matched.length)
    parts.push(t("fallbackSkills", { skills: c.matched.slice(0, 3).join(", "), count: c.matched.length }));
  parts.push(t("fallbackMode", { mode: te(`workMode.${c.workMode}`).toLowerCase() }));
  return parts.join(" · ");
}

export function MatchCardSkeleton() {
  return (
    <div className="border-line bg-raised overflow-hidden rounded-[20px] border" aria-hidden>
      <Skeleton className="h-20 rounded-none sm:h-24" />
      <div className="flex flex-col gap-4 px-5 pb-5">
        <Skeleton className="border-raised -mt-8 size-20 rounded-full border-4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
