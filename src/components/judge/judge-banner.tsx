"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gavel } from "lucide-react";
import { exitJudgeMode, switchJudgeRole } from "@/server/judge";

/** Slim top banner shown while signed in to a judge sandbox. */
export function JudgeBanner({ role }: { role: "TALENT" | "EMPLOYER" | "ADMIN" | null }) {
  const t = useTranslations("judge");
  const locale = useLocale();
  const [busy, setBusy] = React.useState(false);
  const sw = async () => {
    setBusy(true);
    const r = await switchJudgeRole();
    if (r.ok) window.location.assign(`/${locale}${r.href}`);
    else setBusy(false);
  };
  const exit = async () => {
    setBusy(true);
    await exitJudgeMode();
    window.location.assign(`/${locale}`);
  };
  const linkCls =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60 focus-visible:outline-current focus-visible:outline-offset-[-2px]";
  return (
    <div
      role="region"
      aria-label={t("pageTitle")}
      className="bg-ink text-small text-paper dark:bg-cloud dark:text-ink flex items-center justify-center gap-x-2 px-4"
    >
      <Gavel className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{t("banner")}</span>
      <span className="whitespace-nowrap sm:hidden">{t("bannerShort")}</span>
      <span className="flex items-center gap-x-1 whitespace-nowrap">
        <button type="button" onClick={() => void sw()} disabled={busy} className={linkCls}>
          {busy ? t("switching") : role === "TALENT" ? t("toEmployer") : t("toTalent")}
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={() => void exit()} disabled={busy} className={linkCls}>
          {t("exit")}
        </button>
      </span>
    </div>
  );
}
