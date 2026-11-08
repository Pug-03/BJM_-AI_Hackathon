import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { listNotifications } from "@/server/social";
import { NotificationList } from "@/components/notifications/notification-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notifications" });
  return { title: t("title"), robots: { index: false } };
}

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/notifications", locale });
  const t = await getTranslations("notifications");
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <h1 className="text-h1 tracking-display">{t("title")}</h1>
      <NotificationList initial={await listNotifications()} meId={user.id} />
    </div>
  );
}
