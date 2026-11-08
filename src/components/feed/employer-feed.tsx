"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Briefcase, Plus, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { EmptyState } from "@/components/able/empty-state";
import { useAi } from "@/components/ai/ai-provider";
import { durations, easeSmooth, useReducedMotion } from "@/lib/motion";
import type { TalentFilter } from "@/lib/schemas/talent";
import { fetchReasons, loadMatches, skipTalent, type MatchCardData } from "@/server/feed";
import { toggleFollow, toggleStar } from "@/server/talent";
import { startConversation } from "@/server/conversations";
import { FiltersSheet, activeFilterCount } from "./filters-sheet";
import { MatchCard, MatchCardSkeleton } from "./match-card";

export function EmployerFeed({
  needs,
  initialNeedId,
  sampleLabel,
}: {
  needs: { id: string; title: string }[];
  initialNeedId: string;
  sampleLabel: boolean;
}) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const ai = useAi();
  const reduced = useReducedMotion();
  const [needId, setNeedId] = React.useState(initialNeedId);
  const [filter, setFilter] = React.useState<TalentFilter>({});
  const [items, setItems] = React.useState<MatchCardData[]>([]);
  const [next, setNext] = React.useState<number | null>(0);
  const [loading, setLoading] = React.useState(true);
  const [reasons, setReasons] = React.useState<Record<string, string>>({});
  const [pendingReasons, setPendingReasons] = React.useState<Set<string>>(new Set());
  const [swipe, setSwipe] = React.useState(false);
  const [announce, setAnnounce] = React.useState("");
  const gen = React.useRef(0);
  const sentinel = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSwipe(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const askReasons = React.useCallback(
    async (batch: MatchCardData[], g: number) => {
      const missing = batch.filter((c) => !c.reason).map((c) => c.talentId);
      if (!ai.text || !missing.length) return;
      setPendingReasons((s) => new Set([...s, ...missing]));
      const r = await fetchReasons(needId, missing, locale).catch(() => null);
      if (g !== gen.current) return;
      setPendingReasons((s) => new Set([...s].filter((x) => !missing.includes(x))));
      if (r?.ok) setReasons((m) => ({ ...m, ...r.reasons }));
    },
    [ai.text, needId, locale],
  );

  const load = React.useCallback(
    async (offset: number, reset: boolean) => {
      const g = reset ? ++gen.current : gen.current;
      setLoading(true);
      const r = await loadMatches(needId, filter, offset, locale).catch(() => null);
      if (g !== gen.current) return;
      setLoading(false);
      if (!r?.ok) {
        setNext(null);
        return void toast.error(t("loadFailed"));
      }
      setItems((cur) =>
        reset ? r.items : [...cur, ...r.items.filter((x) => !cur.some((c) => c.talentId === x.talentId))],
      );
      setReasons((m) => ({
        ...m,
        ...Object.fromEntries(r.items.filter((x) => x.reason).map((x) => [x.talentId, x.reason!])),
      }));
      setNext(r.next);
      if (reset) setAnnounce(t("resultsCount", { count: r.items.length }));
      void askReasons(r.items, g);
    },
    [needId, filter, locale, t, askReasons],
  );

  React.useEffect(() => {
    setItems([]);
    setNext(0);
    void load(0, true);
  }, [load]);

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || next === null) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0]?.isIntersecting && !loading && next !== null && next > 0) void load(next, false);
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [next, loading, load]);

  const patch = (id: string, p: Partial<MatchCardData>) =>
    setItems((cur) => cur.map((c) => (c.talentId === id ? { ...c, ...p } : c)));

  const star = async (c: MatchCardData) => {
    patch(c.talentId, { starred: !c.starred });
    const r = await toggleStar(c.talentId, !c.starred, needId);
    if (!r.ok) patch(c.talentId, { starred: c.starred });
    else toast.success(c.starred ? t("unstarred", { name: c.name }) : t("starred", { name: c.name }));
  };
  const follow = async (c: MatchCardData) => {
    patch(c.talentId, { following: !c.following });
    const r = await toggleFollow(c.userId, !c.following);
    if (!r.ok) patch(c.talentId, { following: c.following });
  };
  const message = async (c: MatchCardData) => {
    const r = await startConversation(c.userId);
    if (r.ok) window.location.assign(`/${locale}/messages/${r.id}`);
    else toast.error(t("messageFailed"));
  };
  const skip = async (c: MatchCardData) => {
    const idx = items.findIndex((x) => x.talentId === c.talentId);
    setItems((cur) => cur.filter((x) => x.talentId !== c.talentId));
    await skipTalent(needId, c.talentId, true);
    toast(t("skipped", { name: c.name }), {
      action: {
        label: t("undo"),
        onClick: async () => {
          await skipTalent(needId, c.talentId, false);
          setItems((cur) => {
            const n = [...cur];
            n.splice(Math.min(idx, n.length), 0, c);
            return n;
          });
        },
      },
    });
  };

  const changeNeed = (id: string) => {
    setNeedId(id);
    const u = new URL(window.location.href);
    u.searchParams.set("need", id);
    window.history.replaceState(null, "", u);
  };

  const current = needs.find((n) => n.id === needId);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {needs.length > 1 ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label htmlFor="feed-need" className="text-small font-medium">
              {t("position")}
            </label>
            <Select
              id="feed-need"
              value={needId}
              onValueChange={changeNeed}
              options={needs.map((n) => ({ value: n.id, label: n.title }))}
            />
          </div>
        ) : (
          <p className="text-small text-graphite min-w-0 flex-1">
            {t("matchesFor")} <span className="text-ink font-medium">{current?.title}</span>
          </p>
        )}
        <div className="flex gap-2">
          <FiltersSheet value={filter} onApply={setFilter} />
          <Button asChild variant="ghost">
            <Link href="/needs">
              <Briefcase aria-hidden />
              {t("positions")}
            </Link>
          </Button>
        </div>
      </div>
      {swipe ? <p className="text-caption text-graphite -mt-2">{t("swipeHint")}</p> : null}
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>

      <ul className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {items.map((c) => (
            <motion.li
              key={c.talentId}
              layout={!reduced}
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -24, transition: { duration: durations.fast } }}
              transition={{ duration: durations.base, ease: easeSmooth }}
            >
              <MatchCard
                c={c}
                reason={reasons[c.talentId] ?? null}
                reasonLoading={pendingReasons.has(c.talentId)}
                onStar={() => void star(c)}
                onFollow={() => void follow(c)}
                onMessage={() => void message(c)}
                onSkip={() => void skip(c)}
                swipe={swipe}
                sampleLabel={sampleLabel}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {loading ? (
        <div className="flex flex-col gap-4" aria-busy aria-label={t("loading")}>
          <MatchCardSkeleton />
          {items.length ? null : <MatchCardSkeleton />}
        </div>
      ) : null}
      {!loading && !items.length ? (
        <EmptyState
          icon={SearchX}
          title={activeFilterCount(filter) ? t("noMatchesFiltered") : t("noMatches")}
          body={activeFilterCount(filter) ? t("noMatchesFilteredBody") : t("noMatchesBody")}
          action={
            activeFilterCount(filter) ? (
              <Button variant="secondary" onClick={() => setFilter({})}>
                {t("clearFilters")}
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/needs">
                  <Plus aria-hidden />
                  {t("editPosition")}
                </Link>
              </Button>
            )
          }
        />
      ) : null}
      {!loading && items.length && next === null ? (
        <p className="text-small text-graphite text-center">{t("endOfList")}</p>
      ) : null}
      <div ref={sentinel} aria-hidden className="h-1" />
    </div>
  );
}
