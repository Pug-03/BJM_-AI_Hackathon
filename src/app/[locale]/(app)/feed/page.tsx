import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, Building2, Eye, Star, UserRoundPen } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/able/empty-state";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { EmployerFeed } from "@/components/feed/employer-feed";
import { NeedCard } from "@/components/feed/need-card";
import { OrgActions } from "@/components/feed/org-actions";
import { loadTalentFeed } from "@/server/talent-feed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feed" });
  return { title: t("title"), robots: { index: false } };
}

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ need?: string }>;
}) {
  const { locale } = await params;
  const { need } = await searchParams;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/feed", locale });
  if (!user.role) return redirect({ href: "/welcome", locale });
  const t = await getTranslations("feed");

  if (user.role === "EMPLOYER") {
    const org = await db.orgProfile.findUnique({
      where: { userId: user.id },
      select: {
        needs: { where: { isOpen: true }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } },
      },
    });
    if (!org) return redirect({ href: "/onboarding/employer", locale });
    return (
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-display">{t("employerTitle")}</h1>
          <p className="text-graphite">{t("employerIntro")}</p>
          {!user.isSandbox ? <p className="text-caption text-graphite">{t("sampleNote")}</p> : null}
        </header>
        {org.needs.length ? (
          <EmployerFeed
            needs={org.needs}
            initialNeedId={org.needs.find((n) => n.id === need)?.id ?? org.needs[0]!.id}
            sampleLabel={!user.isSandbox}
          />
        ) : (
          <EmptyState
            icon={Briefcase}
            title={t("noPositions")}
            body={t("noPositionsBody")}
            action={
              <Button asChild>
                <Link href="/needs?new=1">{t("addPosition")}</Link>
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const data = await loadTalentFeed(user);
  if (!data) return redirect({ href: "/onboarding/talent", locale });
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-display">{t("talentTitle")}</h1>
          <p className="text-graphite">{t("talentIntro")}</p>
        </header>
        {data.needs.length ? (
          <ul className="flex flex-col gap-4">
            {data.needs.map((n) => (
              <li key={n.id}>
                <NeedCard n={n} sampleLabel={!user.isSandbox} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={UserRoundPen}
            title={t("noOpportunities")}
            body={t("noOpportunitiesBody")}
            action={
              <Button asChild variant="secondary">
                <Link href="/onboarding/talent">{t("improveProfile")}</Link>
              </Button>
            }
          />
        )}
      </div>
      <aside
        aria-labelledby="interested-title"
        className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start"
      >
        <h2 id="interested-title" className="text-h3">
          {t("interestedTitle")}
        </h2>
        {data.interested.length ? (
          <ul className="flex flex-col gap-3">
            {data.interested.map(({ org, kind, following }) => (
              <li
                key={org.userId}
                className="border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-4"
              >
                <div className="flex items-center gap-3">
                  {org.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logoUrl} alt="" className="size-10 rounded-full object-cover" />
                  ) : (
                    <span className="bg-avatar text-graphite flex size-10 shrink-0 items-center justify-center rounded-full">
                      <Building2 className="size-5" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-small flex items-center gap-1.5 font-medium">
                      <Link href={`/o/${org.handle}`} className="truncate hover:underline">
                        {org.name}
                      </Link>
                      <VerifiedBadge tier={org.verifyTier} size={16} />
                    </p>
                    <p className="text-caption text-graphite flex items-center gap-1">
                      {kind === "starred" ? (
                        <Star
                          className="text-star size-3.5"
                          fill="currentColor"
                          strokeWidth={0}
                          aria-hidden
                        />
                      ) : (
                        <Eye className="size-3.5" aria-hidden />
                      )}
                      {kind === "starred" ? t("starredYou") : t("viewedYou")}
                    </p>
                  </div>
                </div>
                <OrgActions orgUserId={org.userId} following={following} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-graphite border-line rounded-[20px] border border-dashed p-4">
            {t("interestedEmpty")}
          </p>
        )}
      </aside>
    </div>
  );
}
