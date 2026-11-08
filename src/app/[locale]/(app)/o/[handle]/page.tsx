import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, Globe, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { matchedSkills } from "@/lib/match";
import { provinceLabel } from "@/config/th-provinces";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { NeedCard } from "@/components/feed/need-card";
import { OrgActions } from "@/components/feed/org-actions";
import { Button } from "@/components/ui/button";

async function load(handle: string) {
  return db.orgProfile.findUnique({
    where: { handle },
    include: {
      user: { select: { isSandbox: true } },
      contacts: true,
      needs: { where: { isOpen: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const o = await load(handle);
  if (!o || o.user.isSandbox) return {};
  return { title: o.name, description: o.description?.slice(0, 160) ?? undefined };
}

/** Public employer page (section 3: /o/[handle]). Registration number is never shown. */
export default async function OrgPage({ params }: { params: Promise<{ locale: string; handle: string }> }) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  const [o, viewer] = await Promise.all([load(handle), getCurrentUser()]);
  if (!o || (o.user.isSandbox && !viewer?.isSandbox && viewer?.id !== o.userId)) notFound();
  const t = await getTranslations("org");
  const te = await getTranslations("enums");
  const owner = viewer?.id === o.userId;
  const [convo, follow, followers, talent] = await Promise.all([
    viewer
      ? db.conversation.findFirst({
          where: { employerUserId: o.userId, talentUserId: viewer.id },
          select: { id: true },
        })
      : null,
    viewer
      ? db.follow.findUnique({
          where: { followerId_followeeUserId: { followerId: viewer.id, followeeUserId: o.userId } },
        })
      : null,
    db.follow.count({ where: { followeeUserId: o.userId } }),
    viewer?.role === "TALENT"
      ? db.talentProfile.findUnique({
          where: { userId: viewer.id },
          select: { skills: { select: { name: true } } },
        })
      : null,
  ]);
  const contacts = o.contacts.filter(
    (c) => owner || c.visibility === "PUBLIC" || (c.visibility === "CHAT_ONLY" && convo),
  );
  const mySkills = talent?.skills.map((s) => s.name) ?? [];
  return (
    <div className="flex flex-col gap-8">
      <div className="bg-mist relative aspect-[16/7] w-full overflow-hidden sm:aspect-[16/5] md:rounded-[20px]">
        {o.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={o.coverUrl}
            alt=""
            className="size-full object-cover dark:brightness-75 dark:saturate-75"
            fetchPriority="high"
          />
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
        <section className="relative z-10 -mt-16 flex flex-col gap-4 sm:-mt-20">
          {o.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={o.logoUrl} alt="" className="border-paper size-28 rounded-full border-4 object-cover" />
          ) : (
            <span className="border-paper bg-avatar text-graphite flex size-28 items-center justify-center rounded-full border-4">
              <Building2 className="size-10" aria-hidden />
            </span>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 tracking-display">
              {o.name} <VerifiedBadge tier={o.verifyTier} size={22} className="inline-flex align-middle" />
            </h1>
            <p className="text-small text-graphite">
              @{o.handle} · {te(`orgType.${o.type}`)}
              {o.isSample && !viewer?.isSandbox ? ` · ${t("sample")}` : ""}
            </p>
          </div>
          <ul className="text-small text-graphite flex flex-col gap-2">
            {o.industry ? <li>{o.industry}</li> : null}
            {o.province ? (
              <li className="flex items-center gap-2">
                <MapPin className="size-4" aria-hidden />
                {provinceLabel(o.province, locale)}
              </li>
            ) : null}
            {o.employeeCount ? (
              <li className="flex items-center gap-2">
                <Users className="size-4" aria-hidden />
                {t("employees", { count: o.employeeCount })}
              </li>
            ) : null}
            <li>{t("followers", { count: followers })}</li>
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <Globe className="size-4" aria-hidden />
                <span className="sr-only">{te(`contact.${c.kind}`)}: </span>
                {c.kind === "WEBSITE" && /^https?:\/\//.test(c.value) ? (
                  <a
                    href={c.value}
                    rel="noopener nofollow"
                    target="_blank"
                    className="text-ink truncate underline-offset-4 hover:underline"
                  >
                    {c.value.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="text-ink truncate">{c.value}</span>
                )}
              </li>
            ))}
          </ul>
          {owner ? (
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/onboarding/employer">{t("edit")}</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/needs">{t("managePositions")}</Link>
              </Button>
            </div>
          ) : viewer?.role === "TALENT" ? (
            <OrgActions orgUserId={o.userId} following={Boolean(follow)} size="md" />
          ) : !viewer ? (
            <Button asChild>
              <Link href={`/login?next=/o/${o.handle}`}>{t("signInToMessage")}</Link>
            </Button>
          ) : null}
        </section>
        <div className="flex min-w-0 flex-col gap-8">
          {o.description ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-h3">{t("about")}</h2>
              <p className="measure text-ink whitespace-pre-line">{o.description}</p>
            </section>
          ) : null}
          <section className="flex flex-col gap-4">
            <h2 className="text-h3">{t("openPositions", { count: o.needs.length })}</h2>
            {o.needs.length ? (
              <ul className="flex flex-col gap-4">
                {o.needs.map((n) => (
                  <li key={n.id}>
                    <NeedCard
                      showOrg={false}
                      canAct={false}
                      sampleLabel={false}
                      n={{
                        ...n,
                        matched: matchedSkills(mySkills, n.skills),
                        org: {
                          userId: o.userId,
                          handle: o.handle,
                          name: o.name,
                          logoUrl: o.logoUrl,
                          verifyTier: o.verifyTier,
                          type: o.type,
                          isSample: o.isSample,
                        },
                        following: Boolean(follow),
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-graphite">{t("noPositions")}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
