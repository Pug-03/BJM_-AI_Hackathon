import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SettingsView } from "@/components/settings/settings-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title"), robots: { index: false } };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/settings", locale });
  const [talent, org, prefs, consents, google] = await Promise.all([
    db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { handle: true, isPublic: true, showAge: true },
    }),
    db.orgProfile.findUnique({ where: { userId: user.id }, select: { handle: true } }),
    db.notificationPrefs.findUnique({ where: { userId: user.id } }),
    db.consentRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.account.findFirst({ where: { userId: user.id, providerId: "google" }, select: { id: true } }),
  ]);
  const latest: Record<string, boolean> = {};
  for (const c of consents) if (!(c.kind in latest)) latest[c.kind] = c.granted;
  const t = await getTranslations("settings");
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="text-graphite">{t("intro")}</p>
      </header>
      <SettingsView
        d={{
          name: user.name ?? "",
          email: user.email,
          isSandbox: user.isSandbox,
          role: user.role,
          google: Boolean(google),
          handle: talent?.handle ?? org?.handle ?? null,
          isTalent: Boolean(talent),
          isPublic: talent?.isPublic ?? true,
          showAge: talent?.showAge ?? false,
          prefs: {
            emailMessages: prefs?.emailMessages ?? true,
            emailOffers: prefs?.emailOffers ?? true,
            showViewers: prefs?.showViewers ?? true,
            whoCanMessage: (prefs?.whoCanMessage as "EVERYONE" | "VERIFIED_ORGS") ?? "EVERYONE",
          },
          consents: latest,
          history: consents.map((c) => ({
            id: c.id,
            kind: c.kind,
            granted: c.granted,
            version: c.version,
            at: c.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
