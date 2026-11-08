import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/able/logo";
import { LanguageSwitch } from "@/components/able/language-switch";
import { ThemeSwitch } from "@/components/able/theme-switch";
import { EmployerBuilder, type EmployerData } from "@/components/onboarding/employer-builder";
import { emptyNeed } from "@/lib/need-draft";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employer" });
  return { title: t("title"), robots: { index: false } };
}

export default async function EmployerOnboarding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/onboarding/employer", locale });
  if (user.role === "TALENT") return redirect({ href: "/onboarding/talent", locale });
  const tb = await getTranslations("brand");
  const org = await db.orgProfile.findUnique({
    where: { userId: user.id },
    include: { contacts: true, needs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const n = org?.needs[0];
  const initial: EmployerData = {
    type: org?.type ?? "PRIVATE_COMPANY",
    name: org?.name ?? "",
    handle: org?.handle ?? "",
    logoUrl: org?.logoUrl ?? null,
    country: org?.country ?? "TH",
    province: org?.province ?? "",
    website: org?.website ?? "",
    employeeCount: org?.employeeCount ? String(org.employeeCount) : "",
    registrationNo: org?.registrationNo ?? "",
    description: org?.description ?? "",
    industry: org?.industry ?? "",
    contacts: org?.contacts.map((c) => ({ kind: c.kind, value: c.value, visibility: c.visibility })) ?? [],
    need: n
      ? {
          id: n.id,
          title: n.title,
          skills: n.skills,
          workMode: n.workMode,
          location: n.location ?? "",
          employmentType: n.employmentType,
          educationLevel: n.educationLevel ?? "",
          ageMin: n.ageMin ? String(n.ageMin) : "",
          ageMax: n.ageMax ? String(n.ageMax) : "",
          offeredSetup: n.offeredSetup,
          description: n.description ?? "",
        }
      : emptyNeed(org?.province ?? ""),
    email: user.email,
  };
  return (
    <div className="bg-paper min-h-dvh">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label={tb("home")} className="flex min-h-11 items-center rounded-lg">
          <Logo />
        </Link>
        <div className="-mr-2 flex items-center">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 pt-4 pb-24 focus:outline-none">
        <EmployerBuilder initial={initial} hasOrg={Boolean(org)} />
      </main>
    </div>
  );
}
