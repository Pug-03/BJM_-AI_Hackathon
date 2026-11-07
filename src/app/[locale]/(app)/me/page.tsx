import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { loadTalentProfile } from "@/server/profile-data";
import { ProfileView } from "@/components/profile/profile-view";

export default async function MyProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/me", locale });
  if (!user.role) return redirect({ href: "/welcome", locale });
  if (user.role === "EMPLOYER") {
    const org = await db.orgProfile.findUnique({ where: { userId: user.id }, select: { handle: true } });
    return redirect({ href: org ? `/o/${org.handle}` : "/onboarding/employer", locale });
  }
  const data = await loadTalentProfile({ userId: user.id }, user);
  if (!data) return redirect({ href: "/onboarding/talent", locale });
  return <ProfileView data={data} />;
}
