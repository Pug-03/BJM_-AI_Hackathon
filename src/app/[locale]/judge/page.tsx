import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/able/site-header";
import { SiteFooter } from "@/components/able/site-footer";
import { JudgeChoices } from "@/components/judge/judge-choices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "judge" });
  return { title: t("pageTitle"), robots: { index: false } };
}

export default async function JudgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("judge");
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16 focus:outline-none md:py-24"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-display">{t("title")}</h1>
          <p className="measure text-graphite">{t("body")}</p>
        </header>
        <JudgeChoices />
      </main>
      <SiteFooter />
    </>
  );
}
