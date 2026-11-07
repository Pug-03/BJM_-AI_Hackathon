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
    "inline-flex min-h-11 items-center rounded-full px-2 font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60";
  return (
    <div
      role="region"
      aria-label={t("pageTitle")}
      className="bg-ink text-small text-paper flex flex-wrap items-center justify-center gap-x-2 px-4"
    >
      <Gavel className="size-4" aria-hidden />
      <span>{t("banner")}</span>
      <button type="button" onClick={() => void sw()} disabled={busy} className={linkCls}>
        {busy ? t("switching") : role === "TALENT" ? t("switchToEmployer") : t("switchToTalent")}
      </button>
      <span aria-hidden>·</span>
      <button type="button" onClick={() => void exit()} disabled={busy} className={linkCls}>
        {t("exit")}
      </button>
    </div>
  );
}
