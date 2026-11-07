"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Briefcase, Info, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { enterJudgeMode } from "@/server/judge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** The two judge-mode choices; used by the dialog and the /judge page. */
export function JudgeChoices({ onCancel }: { onCancel?: () => void }) {
  const t = useTranslations("judge");
  const locale = useLocale();
  const [busy, setBusy] = React.useState<"TALENT" | "EMPLOYER" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const go = async (role: "TALENT" | "EMPLOYER") => {
    setBusy(role);
    setError(null);
    const res = await enterJudgeMode(role);
    if (res.ok) {
      window.location.assign(`/${locale}${res.href}`);
      return;
    }
    setBusy(null);
    setError(
      res.error === "unavailable"
        ? t("unavailable")
        : res.error === "rate_limited"
          ? t("rateLimited")
          : t("failed"),
    );
  };

  const options = [
    { role: "TALENT" as const, label: t("asTalent"), hint: t("talentHint"), icon: Sparkles },
    { role: "EMPLOYER" as const, label: t("asEmployer"), hint: t("employerHint"), icon: Briefcase },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <motion.button
            key={o.role}
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={busy !== null}
            onClick={() => void go(o.role)}
            aria-busy={busy === o.role || undefined}
            className={cn(
              "border-line bg-paper hover:border-graphite flex min-h-32 flex-col items-start gap-3 rounded-[20px] border p-5 text-left transition-colors disabled:opacity-60",
              busy === o.role && "border-brand",
            )}
          >
            <span className="bg-mist flex size-10 items-center justify-center rounded-full">
              <o.icon className="size-5 stroke-[1.75]" aria-hidden />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{busy === o.role ? t("starting") : o.label}</span>
              <span className="text-small text-graphite">{o.hint}</span>
            </span>
          </motion.button>
        ))}
      </div>
      <div aria-live="polite">
        {error ? (
          <p className="text-small text-danger flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
      {onCancel ? (
        <Button variant="ghost" onClick={onCancel} className="self-end" disabled={busy !== null}>
          {t("cancel")}
        </Button>
      ) : null}
    </div>
  );
}
