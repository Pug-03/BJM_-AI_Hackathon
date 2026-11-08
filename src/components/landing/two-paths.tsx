"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabPanel } from "@/components/ui/tabs";

/** Section 6.3 — two paths, 4 numbered steps each (a real sequence). */
export function TwoPaths() {
  const t = useTranslations("home.paths");
  const steps = (k: "talent" | "employer") =>
    ([1, 2, 3, 4] as const).map((n) => ({ title: t(`${k}.s${n}`), body: t(`${k}.b${n}`) }));
  return (
    <Tabs
      label={t("label")}
      items={[
        { value: "talent", label: t("forTalent") },
        { value: "employer", label: t("forEmployers") },
      ]}
    >
      {(["talent", "employer"] as const).map((k) => (
        <TabPanel key={k} value={k} className="pt-8">
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps(k).map((s, i) => (
              <li key={i} className="flex flex-col gap-3">
                <span
                  className="border-line text-small text-ink flex size-9 items-center justify-center rounded-full border font-semibold tabular-nums"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="text-h3">
                  <span className="sr-only">{t("step", { n: i + 1 })} </span>
                  {s.title}
                </h3>
                <p className="text-graphite">{s.body}</p>
              </li>
            ))}
          </ol>
        </TabPanel>
      ))}
    </Tabs>
  );
}
