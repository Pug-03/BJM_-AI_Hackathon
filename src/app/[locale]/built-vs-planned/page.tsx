import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { SiteHeader } from "@/components/able/site-header";
import { SiteFooter } from "@/components/able/site-footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "built" });
  return { title: t("title"), description: t("lead") };
}

/** Honest status page: what works today and what comes next (section 7.6: Tier 3 identity is Phase 2). */
export default async function BuiltVsPlanned({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("built");
  const built = t.raw("built") as string[];
  const planned = t.raw("planned") as string[];
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-12 focus:outline-none md:px-8 md:py-16"
      >
        <header className="mb-12 flex max-w-[720px] flex-col gap-3">
          <h1 className="text-display tracking-display">{t("title")}</h1>
          <p className="text-h3 text-graphite font-normal">{t("lead")}</p>
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-2 lg:gap-16">
          <section aria-labelledby="b-built" className="flex flex-col gap-4">
            <h2 id="b-built" className="text-h2">
              {t("builtTitle")}
            </h2>
            <ul className="divide-line border-line divide-y border-y">
              {built.map((x) => (
                <li key={x} className="flex gap-3 py-3">
                  <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="b-planned" className="flex flex-col gap-4">
            <h2 id="b-planned" className="text-h2">
              {t("plannedTitle")}
            </h2>
            <ul className="divide-line border-line divide-y border-y">
              {planned.map((x) => (
                <li key={x} className="flex gap-3 py-3">
                  <CircleDashed className="text-graphite mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
