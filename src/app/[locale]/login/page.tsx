import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LoginCard } from "@/components/auth/login-card";
import { Logo } from "@/components/able/logo";
import { LanguageSwitch } from "@/components/able/language-switch";
import { ThemeSwitch } from "@/components/able/theme-switch";
import { noticeServices, services } from "@/lib/env";
import { KeyNotice } from "@/components/able/key-notice";
import { JudgeChoices } from "@/components/judge/judge-choices";
import { getCurrentUser, homeFor } from "@/lib/session";

// Creating a judge sandbox writes a lot of sample data; give it room.
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title"), robots: { index: false } };
}

function safeNext(n?: string) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : undefined;
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (user) redirect({ href: safeNext(next) ?? homeFor(user), locale });
  const tb = await getTranslations("brand");
  const tj = await getTranslations("judge");

  return (
    <div className="bg-mist flex min-h-dvh flex-col">
      <header className="bg-mist/90 sticky top-0 z-40 mx-auto flex h-16 w-full items-center justify-between px-[max(1rem,calc((100%-1200px)/2+2rem))] backdrop-blur-md">
        <Link href="/" aria-label={tb("home")} className="flex min-h-11 items-center rounded-lg">
          <Logo />
        </Link>
        <div className="flex items-center">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 pt-4 pb-16 focus:outline-none sm:items-center sm:pt-0 sm:pb-[10vh]"
      >
        <div className="flex w-full max-w-[440px] flex-col gap-6">
          <LoginCard
            googleEnabled={services.google()}
            devOtpInLog={process.env.NODE_ENV !== "production" && !services.email()}
            available={services.database()}
            next={safeNext(next)}
          />
          {/* Judge mode right on the sign-in page (owner request): no sign-up, no scrolling. */}
          <section
            aria-labelledby="judge-login"
            className="border-line bg-paper flex flex-col gap-4 rounded-[20px] border p-6"
          >
            <div className="flex flex-col gap-1">
              <h2 id="judge-login" className="text-h3">
                {tj("loginTitle")}
              </h2>
              <p className="text-small text-graphite">{tj("loginBody")}</p>
            </div>
            <JudgeChoices stacked />
          </section>
        </div>
      </main>
      <KeyNotice missing={noticeServices()} />
    </div>
  );
}
