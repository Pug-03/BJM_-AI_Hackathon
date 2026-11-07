import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { JudgeModeDialog } from "@/components/judge/judge-mode-dialog";
import { Logo } from "./logo";
import { LanguageSwitch } from "./language-switch";

export function SiteFooter() {
  const t = useTranslations("footer");
  const product = [
    { href: "/explore", label: t("explore") },
    { href: "/login", label: t("login") },
    { href: "/employer/quota", label: t("calculator") },
    { href: "/built-vs-planned", label: t("builtVsPlanned") },
  ];
  const policies = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/cookies", label: t("cookies") },
    { href: "/data-rights", label: t("dataRights") },
    { href: "/accessibility", label: t("accessibility") },
  ];
  const linkCls =
    "inline-flex min-h-11 min-w-11 items-center text-small text-graphite hover:text-ink md:min-h-9";
  return (
    <footer className="border-line bg-mist border-t">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="measure text-small text-graphite">{t("pdpa")}</p>
          <div className="-ml-4">
            <LanguageSwitch compact={false} side="top" />
          </div>
        </div>
        <nav aria-label={t("product")}>
          <h2 className="text-small mb-2 font-semibold">{t("product")}</h2>
          <ul>
            {product.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkCls} prefetch={false}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t("policies")}>
          <h2 className="text-small mb-2 font-semibold">{t("policies")}</h2>
          <ul>
            {policies.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkCls} prefetch={false}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="border-line flex flex-col items-center gap-4 border-t py-6 pb-[calc(env(safe-area-inset-bottom)+24px)] md:flex-row md:justify-between">
          <p className="text-caption text-graphite">{t("rights")}</p>
          <JudgeModeDialog />
        </div>
      </div>
    </footer>
  );
}
