"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Info, X } from "lucide-react";

const KEY = "able-key-notice-dismissed";

/** One-line dismissible notice listing services missing in this environment. */
export function KeyNotice({ missing }: { missing: string[] }) {
  const t = useTranslations("notice");
  const [hidden, setHidden] = React.useState(true);
  const sig = missing.join(",");
  React.useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === sig);
    } catch {
      setHidden(false);
    }
  }, [sig]);
  if (!missing.length || hidden) return null;
  const names = missing.map((m) => t(m as "ai")).join(", ");
  return (
    <div role="status" className="flex items-start gap-3 border-b border-line bg-mist px-4 py-2 text-caption text-graphite md:items-center">
      <Info className="mt-0.5 size-4 shrink-0 md:mt-0" aria-hidden />
      <p className="min-w-0 flex-1">{t("missingKeys", { services: names })}</p>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(KEY, sig);
          } catch {}
        }}
        className="-my-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-cloud"
        aria-label={t("dismiss")}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
