import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/able/logo";
import { Link } from "@/i18n/navigation";
import { LanguageSwitch } from "@/components/able/language-switch";
import { ThemeSwitch } from "@/components/able/theme-switch";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RoleChooser } from "./role-chooser";

export const metadata: Metadata = { robots: { index: false } };

export default async function WelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string; role?: string }>;
}) {
  const { locale } = await params;
  const { intent, role } = await searchParams;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login?next=/welcome", locale });
  if (user.role === "TALENT" || user.role === "EMPLOYER") return redirect({ href: "/feed", locale });
  const t = await getTranslations("welcome");
  const tb = await getTranslations("brand");
  return (
    <div className="bg-mist flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label={tb("home")} className="flex min-h-11 items-center rounded-lg">
          <Logo />
        </Link>
        <div className="-mr-2 flex min-w-0 items-center">
          <LanguageSwitch />
          <ThemeSwitch />
          <SignOutButton label={t("signOut")} compact />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 pt-6 pb-16 focus:outline-none"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-h1 tracking-display">{t("title")}</h1>
          <p className="text-graphite">
            {t.rich("subtitle", { nb: (c) => <span className="whitespace-nowrap">{c}</span> })}
          </p>
        </header>
        <RoleChooser
          initial={
            role === "TALENT" || role === "EMPLOYER" ? role : intent === "hire" ? "EMPLOYER" : undefined
          }
        />
      </main>
    </div>
  );
}
