import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/able/logo";
import { RoleChooser } from "./role-chooser";

export const metadata: Metadata = { robots: { index: false } };

export default async function WelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const { locale } = await params;
  const { intent } = await searchParams;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/welcome", locale });
  if (user.role === "TALENT" || user.role === "EMPLOYER") return redirect({ href: "/feed", locale });
  const t = await getTranslations("welcome");
  return (
    <div className="bg-mist flex min-h-dvh flex-col">
      <header className="px-4 py-3 md:px-8">
        <Logo />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 pt-6 pb-16 focus:outline-none"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-display">{t("title")}</h1>
          <p className="text-graphite">{t("subtitle")}</p>
        </header>
        <RoleChooser initial={intent === "hire" ? "EMPLOYER" : undefined} />
      </main>
    </div>
  );
}
