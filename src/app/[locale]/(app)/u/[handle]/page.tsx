import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserX } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { loadTalentProfile } from "@/server/profile-data";
import { ProfileView } from "@/components/profile/profile-view";
import { EmptyState } from "@/components/able/empty-state";

type Params = { params: Promise<{ locale: string; handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const data = await loadTalentProfile({ handle: handle.toLowerCase() }, null).catch(() => null);
  if (!data) return { title: "ABLE", robots: { index: false } };
  const p = data.profile;
  return {
    title: p.displayName,
    description: p.headline ?? undefined,
    robots: p.isSample ? { index: false } : undefined,
    openGraph: {
      title: p.displayName,
      description: p.headline ?? undefined,
    },
  };
}

export default async function PublicProfile({ params }: Params) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  const viewer = await getCurrentUser();
  const data = await loadTalentProfile({ handle: handle.toLowerCase() }, viewer);
  if (!data) {
    const t = await getTranslations("profile");
    return <EmptyState icon={UserX} title={t("notFound")} />;
  }
  return <ProfileView data={data} />;
}
