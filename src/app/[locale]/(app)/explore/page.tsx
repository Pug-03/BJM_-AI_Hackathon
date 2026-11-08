import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/able/empty-state";
import { TalentCard } from "@/components/explore/talent-card";
import { ExploreControls } from "@/components/explore/explore-controls";
import { filterToQuery } from "@/lib/filter-query";
import { talentFilterSchema, type TalentFilter } from "@/lib/schemas/talent";
import { talentCardSelect, talentWhere, toCard } from "@/lib/talent-query";

const PAGE = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });
  return { title: t("title"), description: t("subtitle") };
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Only whitelisted keys are read from the URL; the strict schema rejects anything else. */
function parseFilter(sp: SP): TalentFilter {
  const skills = ([] as string[])
    .concat(sp.skill ?? [])
    .filter(Boolean)
    .slice(0, 10);
  const raw = {
    q: one(sp.q) || undefined,
    skills: skills.length ? skills : undefined,
    location: one(sp.location) || undefined,
    workMode: one(sp.mode) || undefined,
    availability: one(sp.availability) || undefined,
    educationLevel: one(sp.education) || undefined,
    hasCertificates: one(sp.certs) === "1" || undefined,
    minRating: one(sp.rating) ? Number(one(sp.rating)) : undefined,
  };
  const r = talentFilterSchema.safeParse(raw);
  return r.success ? r.data : {};
}

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filter = parseFilter(sp);
  const page = Math.max(1, Math.min(20, Number(one(sp.page)) || 1));
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("explore")]);
  const where = talentWhere(filter);
  const [rows, total] = await Promise.all([
    db.talentProfile.findMany({
      where,
      orderBy: [{ ratingAvg: "desc" }, { updatedAt: "desc" }],
      take: page * PAGE,
      select: talentCardSelect,
    }),
    db.talentProfile.count({ where }),
  ]);
  const qs = filterToQuery(filter);
  return (
    <div className="flex flex-col gap-8 lg:pt-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="measure text-graphite">{t("subtitle")}</p>
      </header>
      <ExploreControls filter={filter} />
      <p className="text-small text-graphite" aria-live="polite">
        {t("resultCount", { count: total })}
      </p>
      {rows.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r, i) => (
            <li key={r.id}>
              <TalentCard c={toCard(r)} sampleLabel={!user?.isSandbox} eager={i < 3} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={SearchX}
          title={t("noResults")}
          body={t("noResultsBody")}
          action={
            <Button asChild variant="secondary">
              <Link href="/explore">{t("clear")}</Link>
            </Button>
          }
        />
      )}
      {rows.length < total ? (
        <div className="flex justify-center">
          <Button asChild variant="secondary">
            <Link href={`/explore?${qs ? `${qs}&` : ""}page=${page + 1}`} scroll={false}>
              {t("showMore")}
            </Link>
          </Button>
        </div>
      ) : null}
      {!user ? (
        <p className="text-small text-graphite text-center">
          {t("readOnly")}{" "}
          <Link href="/login" className="text-brand underline-offset-4 hover:underline">
            {t("signInCta")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
