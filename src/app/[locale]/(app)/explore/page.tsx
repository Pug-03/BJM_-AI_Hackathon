import { getTranslations, setRequestLocale } from "next-intl/server";
import { Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/able/empty-state";

// Interim directory shell — the searchable talent directory is built with profiles (Stage 4) and matching (Stage 6).
export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("explore");
  return (
    <div className="flex flex-col gap-12 lg:pt-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="measure text-graphite">{t("subtitle")}</p>
      </header>
      <EmptyState
        icon={Users}
        title={t("emptyTitle")}
        body={t("emptyBody")}
        action={
          <Button asChild>
            <Link href="/login">{t("emptyAction")}</Link>
          </Button>
        }
      />
    </div>
  );
}
