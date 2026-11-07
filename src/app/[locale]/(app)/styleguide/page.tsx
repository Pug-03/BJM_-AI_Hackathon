import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Styleguide } from "./styleguide";

export const metadata: Metadata = { robots: { index: false } };

export default async function StyleguidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("styleguide");
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="text-graphite">{t("intro")}</p>
      </header>
      <Styleguide />
    </div>
  );
}
