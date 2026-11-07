"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

/**
 * Principle 5: anything AI wrote carries an "AI suggestion" label until the person
 * keeps it or edits it.
 */
export function AiNote({ onKeep, onUndo }: { onKeep: () => void; onUndo?: () => void }) {
  const t = useTranslations("ai");
  const link =
    "text-caption text-ink inline-flex min-h-11 items-center rounded-full px-2 font-medium underline-offset-4 hover:underline md:min-h-8 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-brand";
  return (
    <div className="text-caption text-graphite -my-2 flex flex-wrap items-center gap-x-1">
      <Sparkles className="text-brand size-3.5" aria-hidden />
      <span className="text-brand font-medium">{t("suggestion")}</span>
      <span>· {t("checkIt")}</span>
      <span className="ml-auto flex">
        {onUndo ? (
          <button type="button" className={link} onClick={onUndo}>
            {t("undo")}
          </button>
        ) : null}
        <button type="button" className={link} onClick={onKeep}>
          {t("keep")}
        </button>
      </span>
    </div>
  );
}
