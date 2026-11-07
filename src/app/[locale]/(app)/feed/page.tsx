import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/able/empty-state";

// Interim feed (Stage 3) — replaced by the matched MatchCard feed in Stage 6.
export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/feed", locale });
  if (!user.role) return redirect({ href: "/welcome", locale });
  const t = await getTranslations("feed");
  const employer = user.role === "EMPLOYER";
  const items = employer
    ? (
        await db.talentProfile.findMany({
          where: { isPublic: true, user: { isSandbox: false } },
          take: 12,
          orderBy: { ratingAvg: "desc" },
          select: { id: true, displayName: true, headline: true, avatarUrl: true, isSample: true },
        })
      ).map((x) => ({ id: x.id, name: x.displayName, sub: x.headline, img: x.avatarUrl, sample: x.isSample }))
    : (
        await db.orgProfile.findMany({
          where: { user: { isSandbox: false } },
          take: 12,
          select: { id: true, name: true, industry: true, logoUrl: true, isSample: true },
        })
      ).map((x) => ({ id: x.id, name: x.name, sub: x.industry, img: x.logoUrl, sample: x.isSample }));
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="text-graphite">{employer ? t("employerIntro") : t("talentIntro")}</p>
        {!user.isSandbox && items.some((i) => i.sample) ? (
          <p className="text-caption text-graphite">{t("sampleNote")}</p>
        ) : null}
      </header>
      {items.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="border-line bg-raised flex min-w-0 items-center gap-3 rounded-[20px] border p-4"
            >
              <Avatar src={i.img} name={i.name} size="md" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{i.name}</span>
                <span className="text-small text-graphite truncate">{i.sub}</span>
              </span>
              {i.sample && !user.isSandbox ? (
                <span className="bg-mist text-caption text-graphite shrink-0 rounded-full px-2.5 py-0.5">
                  {t("sample")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("empty")} />
      )}
    </div>
  );
}
