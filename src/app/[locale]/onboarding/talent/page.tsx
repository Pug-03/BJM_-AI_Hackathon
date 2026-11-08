import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/able/logo";
import { LanguageSwitch } from "@/components/able/language-switch";
import { ThemeSwitch } from "@/components/able/theme-switch";
import { TalentBuilder, type BuilderData } from "@/components/onboarding/talent-builder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboard" });
  return { title: t("title"), robots: { index: false } };
}

export default async function TalentOnboarding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/onboarding/talent", locale });
  if (user.role === "EMPLOYER") return redirect({ href: "/onboarding/employer", locale });
  const tb = await getTranslations("brand");

  const p = await db.talentProfile.findUnique({
    where: { userId: user.id },
    include: { skills: true, educations: true, certificates: true, portfolio: true, contacts: true },
  });
  const consents = await db.consentRecord.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const latest = (kind: string) => consents.find((c) => c.kind === kind)?.granted ?? false;
  const [first = "", ...rest] = (user.name || "").split(" ");

  const initial: BuilderData = {
    avatarUrl: p?.avatarUrl ?? user.image ?? null,
    firstName: p?.firstName ?? first,
    lastName: p?.lastName ?? rest.join(" "),
    displayName: p?.displayName ?? user.name ?? "",
    handle: p?.handle ?? "",
    dob: p?.dob ? p.dob.toISOString().slice(0, 10) : "",
    showAge: p?.showAge ?? false,
    gender: p?.gender ?? "",
    country: p?.country ?? "TH",
    province: p?.province ?? "",
    headline: p?.headline ?? "",
    bio: p?.bio ?? "",
    languages: p?.languages.length ? p.languages : locale === "th" ? ["Thai"] : ["English"],
    workMode: p?.workMode ?? "ANY",
    availability: p?.availability ?? [],
    skills: p?.skills.map((s) => s.name) ?? [],
    specialTalents: p?.specialTalents ?? "",
    educations:
      p?.educations.map((e) => ({
        level: e.level,
        school: e.school,
        field: e.field ?? "",
        yearEnd: e.yearEnd ? String(e.yearEnd) : "",
      })) ?? [],
    certificates:
      p?.certificates.map((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        issuer: c.issuer,
        issuedAt: c.issuedAt?.toISOString().slice(0, 10) ?? null,
        fileUrl: c.fileUrl,
      })) ?? [],
    portfolio:
      p?.portfolio.map((x) => ({ id: x.id, title: x.title, description: x.description, images: x.images })) ??
      [],
    contacts: p?.contacts.map((c) => ({ kind: c.kind, value: c.value, visibility: c.visibility })) ?? [],
    workSetupNeeds: p?.workSetupNeeds ?? "",
    isPublic: p?.isPublic ?? true,
    consentAi: latest("AI_PROCESSING"),
    consentWorkSetup: latest("WORK_SETUP"),
    email: user.email,
  };

  return (
    <div className="bg-paper min-h-dvh">
      <header className="bg-paper/90 sticky top-0 z-40 flex h-16 items-center justify-between px-[max(1rem,calc((100%-48rem)/2+1rem))] backdrop-blur-md">
        <Link href="/" aria-label={tb("home")} className="flex min-h-11 items-center rounded-lg">
          <Logo />
        </Link>
        <div className="-mr-2 flex items-center">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 pt-4 pb-24 focus:outline-none">
        <TalentBuilder initial={initial} hasProfile={Boolean(p)} />
      </main>
    </div>
  );
}
