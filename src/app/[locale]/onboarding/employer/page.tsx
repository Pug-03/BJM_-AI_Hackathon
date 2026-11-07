import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";

// Interim page — the full employer onboarding builder replaces this in its stage.
export default async function Onboarding({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login", locale });
  const t = await getTranslations("onboarding");
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-3 px-4">
      <h1 className="text-h1 tracking-display">{t("employerTitle")}</h1>
      <p className="text-graphite">{t("soon")}</p>
    </main>
  );
}
