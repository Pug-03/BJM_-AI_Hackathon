import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/able/site-header";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <section className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-20 md:px-8 md:py-32">
          <h1 className="text-display tracking-display max-w-3xl">{t("headline")}</h1>
          <p className="measure text-graphite text-[1.125rem] md:text-[1.25rem]">{t("subline")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login?intent=hire">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
