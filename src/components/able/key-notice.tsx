"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Info, X } from "lucide-react";

const KEY = "able-key-notice-dismissed";

/** Dismissible notice listing services missing in this environment. */
export function KeyNotice({
  missing,
  aboveBottomNav = false,
}: {
  missing: string[];
  aboveBottomNav?: boolean;
}) {
  const t = useTranslations("notice");
  const [hidden, setHidden] = React.useState(false);
  const sig = missing.join(",");
  React.useEffect(() => {
    try {
      // `able-qa` hides the notice in QA screenshots.
      setHidden(localStorage.getItem(KEY) === sig || localStorage.getItem("able-qa") === "1");
    } catch {
      setHidden(false);
    }
  }, [sig]);
  if (!missing.length || hidden) return null;
  const names = missing.map((m) => t(m as "ai")).join(", ");
  // Floating, out of document flow: appearing after hydration must not shift the page (CLS).
  return (
    <div
      data-key-notice
      className={`border-line bg-paper text-caption text-graphite shadow-float fixed max-md:static max-md:mx-4 max-md:my-6 max-md:max-w-none ${aboveBottomNav ? "bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+24px)]" : "bottom-[calc(env(safe-area-inset-bottom)+16px)]"} left-4 z-30 flex max-w-[min(360px,calc(100vw-32px))] items-start gap-3 rounded-[20px] border py-3 pr-2 pl-4 md:bottom-6 ${aboveBottomNav ? "md:left-[calc(var(--rail-w)+24px)]" : "md:left-6"}`}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">{t("missingKeys", { services: names })}</p>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(KEY, sig);
          } catch {}
        }}
        className="hover:bg-mist -my-2 flex size-11 shrink-0 items-center justify-center rounded-full"
        aria-label={t("dismiss")}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
