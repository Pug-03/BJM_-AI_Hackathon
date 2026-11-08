"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { levyEstimate, quotaGap } from "@/lib/quota";

/** Section 33 calculator (section 7.10). The levy uses QUOTA_LEVY_PER_PERSON_THB only when set. */
export function QuotaCalculator({
  initialEmployees,
  initialHires,
  levy,
}: {
  initialEmployees: number | null;
  initialHires: number | null;
  levy: number | null;
}) {
  const t = useTranslations("quota");
  const locale = useLocale();
  const [n, setN] = React.useState(initialEmployees ? String(initialEmployees) : "");
  const [h, setH] = React.useState(initialHires ? String(initialHires) : "0");
  const { required, gap } = quotaGap(Number(n) || 0, Number(h) || 0);
  const est = levyEstimate(gap, levy);
  const fmt = (x: number) => new Intl.NumberFormat(locale).format(x);
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <Field id="q-n" label={t("employees")} hint={t("employeesHint")}>
          {(a) => (
            <Input
              {...a}
              inputMode="numeric"
              maxLength={7}
              value={n}
              onChange={(e) => setN(e.target.value.replace(/\D/g, ""))}
            />
          )}
        </Field>
        <Field id="q-h" label={t("current")} hint={t("currentHint")}>
          {(a) => (
            <Input
              {...a}
              inputMode="numeric"
              maxLength={6}
              value={h}
              onChange={(e) => setH(e.target.value.replace(/\D/g, ""))}
            />
          )}
        </Field>
      </form>
      <output
        htmlFor="q-n q-h"
        aria-live="polite"
        className="border-line bg-raised flex flex-col gap-4 rounded-[20px] border p-6"
      >
        <div>
          <p className="text-small text-graphite">{t("required")}</p>
          {n ? (
            <p className="text-display tracking-display tabular-nums">{fmt(required)}</p>
          ) : (
            <p className="text-h3 text-graphite mt-1 font-normal">{t("enterHeadcount")}</p>
          )}
        </div>
        <div className="border-line border-t pt-4">
          <p className="text-small text-graphite">{t("gap")}</p>
          <p className={n ? "text-h1 tabular-nums" : "text-h3 text-graphite font-normal"}>
            {n ? fmt(gap) : "—"}
          </p>
        </div>
        <p className="text-small text-graphite">
          {est != null ? t("levyEstimate", { amount: fmt(est) }) : t("levyUnset")}
        </p>
      </output>
    </div>
  );
}
