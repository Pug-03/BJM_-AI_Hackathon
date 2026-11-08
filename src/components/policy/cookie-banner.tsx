"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const COOKIE = "able-cookies";
type Choice = "necessary" | "all";

function read(): Choice | null {
  const m = document.cookie.match(/(?:^|; )able-cookies=(necessary|all)/);
  return (m?.[1] as Choice) ?? null;
}
function write(c: Choice) {
  document.cookie = `${COOKIE}=${c}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

/** Opens the banner again (footer "Cookie settings"). */
export function openCookieSettings() {
  window.dispatchEvent(new Event("able:cookie-settings"));
}

/**
 * Cookie banner (section 9): first visit only. ABLE loads no analytics, so "Accept all"
 * and "Reject optional" both keep things necessary-only today — the banner says so.
 * Floating (fixed), so it never shifts the page.
 */
export function CookieBanner() {
  const t = useTranslations("policy.cookieBanner");
  const [open, setOpen] = React.useState(false);
  const [choose, setChoose] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let qa = false;
    try {
      qa = localStorage.getItem("able-qa") === "1";
    } catch {}
    if (!qa && !read()) setOpen(true);
    const reopen = () => {
      setAnalytics(read() === "all");
      setChoose(true);
      setOpen(true);
      requestAnimationFrame(() => ref.current?.focus());
    };
    window.addEventListener("able:cookie-settings", reopen);
    return () => window.removeEventListener("able:cookie-settings", reopen);
  }, []);

  if (!open) return null;
  const done = (c: Choice) => {
    write(c);
    setOpen(false);
    setChoose(false);
  };
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-labelledby="cookie-title"
      className="border-line bg-paper shadow-float fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+16px)] left-4 z-[46] flex max-w-[440px] animate-[able-rise-fade_260ms_var(--ease-smooth)_both] flex-col gap-4 rounded-[20px] border p-5 focus:outline-none md:right-6 md:bottom-6 md:left-auto"
    >
      <div className="flex flex-col gap-1">
        <h2 id="cookie-title" className="text-body font-semibold">
          {t("title")}
        </h2>
        <p className="text-small text-graphite">
          {t("body")}{" "}
          <Link href="/cookies" className="text-ink underline underline-offset-4">
            {t("more")}
          </Link>
        </p>
      </div>
      {choose ? (
        <ul className="flex flex-col gap-3">
          <li className="bg-mist flex items-center justify-between gap-4 rounded-[14px] px-4 py-3">
            <span className="flex flex-col">
              <span className="text-small font-medium">{t("necessary")}</span>
              <span className="text-caption text-graphite">{t("necessaryNote")}</span>
            </span>
            <Switch checked disabled aria-label={t("necessary")} />
          </li>
          <li className="bg-mist flex items-center justify-between gap-4 rounded-[14px] px-4 py-3">
            <label htmlFor="ck-analytics" className="flex flex-col">
              <span className="text-small font-medium">{t("analytics")}</span>
              <span className="text-caption text-graphite">{t("analyticsNote")}</span>
            </label>
            <Switch id="ck-analytics" checked={analytics} onCheckedChange={setAnalytics} />
          </li>
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {choose ? (
          <Button size="sm" onClick={() => done(analytics ? "all" : "necessary")}>
            {t("save")}
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={() => done("all")}>
              {t("accept")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => done("necessary")}>
              {t("reject")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setChoose(true)}>
              {t("choose")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function CookieSettingsLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  );
}
