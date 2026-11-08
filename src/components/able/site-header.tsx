import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { LanguageSwitch } from "./language-switch";
import { ThemeSwitch } from "./theme-switch";
import { SiteMenu } from "./site-menu";
import { HeaderShell } from "./header-shell";
import { AnchorLink } from "./anchor-link";
import { JudgeModeDialog } from "@/components/judge/judge-mode-dialog";

/** Marketing header for public pages. */
export function SiteHeader() {
  const t = useTranslations("site");
  const tn = useTranslations("nav");
  const tb = useTranslations("brand");
  return (
    <>
      <HeaderShell>
        <Link href="/" aria-label={tb("home")} className="flex min-h-11 items-center rounded-lg">
          <Logo />
        </Link>
        <nav aria-label={t("primaryNav")} className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            <li>
              <Button asChild variant="ghost" size="sm">
                <AnchorLink hash="how">{t("howItWorks")}</AnchorLink>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost" size="sm">
                <AnchorLink hash="employers">{t("forEmployers")}</AnchorLink>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost" size="sm">
                <AnchorLink hash="faq">{t("faq")}</AnchorLink>
              </Button>
            </li>
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center sm:flex">
            <LanguageSwitch />
            <ThemeSwitch />
          </div>
          {/* Judges reach the demo from the top of every public page, no scrolling. */}
          <JudgeModeDialog variant="header" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{tn("login")}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{tn("getStarted")}</Link>
          </Button>
          <SiteMenu />
        </div>
      </HeaderShell>
    </>
  );
}
