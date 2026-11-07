import { getTranslations, setRequestLocale } from "next-intl/server";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/able/empty-state";

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("explore");
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="text-graphite">{t("subtitle")}</p>
      </header>
      <EmptyState icon={Users} title={t("emptyTitle")} body={t("emptyBody")} />
    </div>
  );
}
