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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-16 focus:outline-none md:px-8 md:py-24"
      >
        <div className="mx-auto flex max-w-[720px] flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-h1 tracking-display">{t("title")}</h1>
            <p className="measure text-graphite">
              {t.rich("body", { nb: (c) => <span className="whitespace-nowrap">{c}</span> })}
            </p>
          </header>
          <JudgeChoices />
          <p className="text-small text-graphite">{t("reassure")}</p>
        </div>
      </main>
      <SiteFooter hideJudge />
    </div>
  );
}
