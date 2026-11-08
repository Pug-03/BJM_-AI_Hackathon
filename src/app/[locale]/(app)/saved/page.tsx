import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bookmark, Building2 } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { EmptyState } from "@/components/able/empty-state";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { TalentCard } from "@/components/explore/talent-card";
import { talentCardSelect, toCard } from "@/lib/talent-query";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saved" });
  return { title: t("title"), robots: { index: false } };
}

/** Employer: starred + followed talent. Talent: followed employers. */
export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/saved", locale });
  const t = await getTranslations("saved");
  const sandboxOk = user.isSandbox ? {} : { user: { isSandbox: false } };

  if (user.role === "EMPLOYER") {
    const [stars, follows] = await Promise.all([
      db.star.findMany({
        where: { employerUserId: user.id },
        orderBy: { createdAt: "desc" },
        select: { talentId: true },
      }),
      db.follow.findMany({
        where: { followerId: user.id },
        orderBy: { createdAt: "desc" },
        select: { followeeUserId: true },
      }),
    ]);
    const [starred, followed] = await Promise.all([
      db.talentProfile.findMany({
        where: { id: { in: stars.map((s) => s.talentId) }, ...sandboxOk },
        select: talentCardSelect,
      }),
      db.talentProfile.findMany({
        where: { userId: { in: follows.map((s) => s.followeeUserId) }, ...sandboxOk },
        select: talentCardSelect,
      }),
    ]);
    const section = (title: string, rows: typeof starred, empty: string) => (
      <section className="flex flex-col gap-4">
        <h2 className="text-h3">
          {title} <span className="text-graphite font-normal">({rows.length})</span>
        </h2>
        {rows.length ? (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li key={r.id}>
                <TalentCard c={toCard(r, locale)} sampleLabel={!user.isSandbox} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-graphite border-line rounded-[20px] border border-dashed p-4">
            {empty}
          </p>
        )}
      </section>
    );
    return (
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-display">{t("title")}</h1>
          <p className="text-graphite">{t("employerIntro")}</p>
        </header>
        {section(t("starred"), starred, t("starredEmpty"))}
        {section(t("following"), followed, t("followingEmpty"))}
      </div>
    );
  }

  const follows = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followeeUserId: true },
  });
  const orgs = await db.orgProfile.findMany({
    where: { userId: { in: follows.map((f) => f.followeeUserId) }, ...sandboxOk },
    select: {
      id: true,
      handle: true,
      name: true,
      logoUrl: true,
      verifyTier: true,
      industry: true,
      _count: { select: { needs: { where: { isOpen: true } } } },
    },
  });
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="text-graphite">{t("talentIntro")}</p>
      </header>
      {orgs.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {orgs.map((o) => (
            <li
              key={o.id}
              className="border-line bg-raised relative flex items-center gap-3 rounded-[20px] border p-4"
            >
              {o.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.logoUrl} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <span className="bg-avatar text-graphite flex size-12 shrink-0 items-center justify-center rounded-full">
                  <Building2 className="size-5" aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-medium">
                  <Link href={`/o/${o.handle}`} className="truncate after:absolute after:inset-0">
                    {o.name}
                  </Link>
                  <VerifiedBadge tier={o.verifyTier} size={16} className="relative z-10" />
                </p>
                <p className="text-caption text-graphite truncate">
                  {[o.industry, t("openCount", { count: o._count.needs })].filter(Boolean).join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Bookmark} title={t("talentEmpty")} body={t("talentEmptyBody")} />
      )}
    </div>
  );
}
