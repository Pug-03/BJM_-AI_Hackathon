import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { NeedsManager } from "@/components/employer/needs-manager";
import { st } from "@/lib/sample-i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employer" });
  return { title: t("needsTitle"), robots: { index: false } };
}

export default async function NeedsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/needs", locale });
  if (user.role !== "EMPLOYER") return redirect({ href: "/feed", locale });
  const org = await db.orgProfile.findUnique({
    where: { userId: user.id },
    include: { needs: { orderBy: { createdAt: "desc" }, include: { _count: { select: { scores: true } } } } },
  });
  if (!org) return redirect({ href: "/onboarding/employer", locale });
  const t = await getTranslations("employer");
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("needsTitle")}</h1>
        <p className="text-graphite measure">{t("needsIntro")}</p>
      </header>
      <NeedsManager
        openNew={sp.new === "1"}
        province={org.province ?? ""}
        initial={org.needs.map((n) => ({
          id: n.id,
          title: n.title,
          displayTitle: st(n.title, locale),
          skills: n.skills,
          workMode: n.workMode,
          location: n.location ?? "",
          employmentType: n.employmentType,
          educationLevel: n.educationLevel ?? "",
          ageMin: n.ageMin ? String(n.ageMin) : "",
          ageMax: n.ageMax ? String(n.ageMax) : "",
          offeredSetup: n.offeredSetup,
          description: n.description ?? "",
          isOpen: n.isOpen,
          matches: n._count.scores,
        }))}
      />
    </div>
  );
}
