import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { LanguageSwitch } from "./language-switch";
import { ThemeSwitch } from "./theme-switch";
import { SiteMenu } from "./site-menu";
import { KeyNotice } from "./key-notice";
import { missingServices } from "@/lib/env";

/** Marketing header for public pages. */
export function SiteHeader() {
  const t = useTranslations("site");
  const tn = useTranslations("nav");
  const tb = useTranslations("brand");
  return (
    <>
      <KeyNotice missing={missingServices()} />
      <header className="border-line bg-paper relative z-20 border-b">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 md:px-8">
          <Link href="/" aria-label={tb("home")} className="flex min-h-11 items-center rounded-lg">
            <Logo />
          </Link>
          <nav aria-label={t("primaryNav")} className="ml-6 hidden lg:block">
            <ul className="flex items-center gap-1">
              <li>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/#how">{t("howItWorks")}</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/#employers">{t("forEmployers")}</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/#faq">{t("faq")}</Link>
                </Button>
              </li>
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden items-center sm:flex">
              <LanguageSwitch />
              <ThemeSwitch />
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">{tn("login")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">{tn("getStarted")}</Link>
            </Button>
            <SiteMenu />
          </div>
        </div>
      </header>
    </>
  );
}
