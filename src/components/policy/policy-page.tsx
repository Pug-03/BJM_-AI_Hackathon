import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/able/site-header";
import { SiteFooter } from "@/components/able/site-footer";
import { CONSENT_VERSION } from "@/lib/consent";

export type PolicyKey = "privacy" | "terms" | "cookies" | "dataRights" | "accessibility";

export async function policyMetadata(locale: string, key: PolicyKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "policy" });
  return { title: t(`${key}.title`), description: t(`${key}.lead`) };
}

/** Plain-language policy page (section 9), EN + TH, from messages `policy.<key>.sections`. */
export async function PolicyPage({ locale, k }: { locale: string; k: PolicyKey }) {
  setRequestLocale(locale);
  const t = await getTranslations("policy");
  const lang = await getLocale();
  const sections = t.raw(`${k}.sections`) as { h: string; p: string[] }[];
  const date = new Date(CONSENT_VERSION).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-12 focus:outline-none md:px-8 md:py-16"
      >
        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,720px)] lg:gap-16">
          <nav aria-label={t("contents")} className="hidden lg:block">
            <p className="text-small text-graphite mb-3 font-medium">{t("contents")}</p>
            <ol className="text-small sticky top-8 flex flex-col gap-2">
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#s${i + 1}`} className="text-graphite hover:text-ink">
                    {s.h}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="flex flex-col gap-10">
            <header className="flex flex-col gap-3">
              <h1 className="text-display tracking-display">{t(`${k}.title`)}</h1>
              <p className="text-h3 text-graphite font-normal">{t(`${k}.lead`)}</p>
              <p className="text-caption text-graphite">{t("updated", { date })}</p>
            </header>
            {sections.map((s, i) => (
              <section
                key={i}
                id={`s${i + 1}`}
                aria-labelledby={`s${i + 1}-h`}
                className="flex scroll-mt-8 flex-col gap-3"
              >
                <h2 id={`s${i + 1}-h`} className="text-h2">
                  {s.h}
                </h2>
                {s.p.map((para, j) => (
                  <p key={j} className="measure text-ink">
                    {para}
                  </p>
                ))}
              </section>
            ))}
            <p className="border-line text-small text-graphite border-t pt-6">{t("contact")}</p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
