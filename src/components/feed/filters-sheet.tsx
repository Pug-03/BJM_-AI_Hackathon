"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { ChipInput } from "@/components/ui/chip-input";
import { Switch } from "@/components/ui/switch";
import { ToggleChips } from "@/components/ui/toggle-chips";
import { skillSuggestions, thProvinces } from "@/config/th-provinces";
import { availabilities, educationLevels, workModes, type TalentFilter } from "@/lib/schemas/talent";

export function activeFilterCount(f: TalentFilter) {
  return (
    (f.skills?.length ? 1 : 0) +
    (f.location ? 1 : 0) +
    (f.workMode ? 1 : 0) +
    (f.availability ? 1 : 0) +
    (f.educationLevel ? 1 : 0) +
    (f.hasCertificates ? 1 : 0) +
    (f.minRating ? 1 : 0)
  );
}

/**
 * Filters (section 7.7): skills, location, work mode, availability, education, certificates,
 * rating. There is no disability, gender, religion, ethnicity or age filter — by design.
 */
export function FiltersSheet({
  value,
  onApply,
}: {
  value: TalentFilter;
  onApply: (f: TalentFilter) => void;
}) {
  const t = useTranslations("filters");
  const te = useTranslations("enums");
  const ts = useTranslations("styleguide");
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState<TalentFilter>(value);
  React.useEffect(() => {
    if (open) setF(value);
  }, [open, value]);
  const n = activeFilterCount(value);
  const ANY = "__any";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <SlidersHorizontal aria-hidden />
        {t("title")}
        {n ? <span className="bg-ink text-paper text-caption ml-1 rounded-full px-2 py-0.5">{n}</span> : null}
      </Button>
      <SheetContent
        title={t("title")}
        description={t("fairNote")}
        closeLabel={t("close")}
        className="md:max-w-[560px]"
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            onApply(f);
            setOpen(false);
          }}
        >
          <Field id="f-skills" label={t("skills")}>
            {(a) => (
              <ChipInput
                {...a}
                value={f.skills ?? []}
                onChange={(v) => setF({ ...f, skills: v.length ? v : undefined })}
                placeholder={t("skillsPlaceholder")}
                addLabel={ts("addSkill")}
                removeLabel={(s) => ts("removeSkill", { skill: s })}
                suggestions={skillSuggestions}
                max={10}
              />
            )}
          </Field>
          <Field id="f-location" label={t("location")}>
            {(a) => (
              <Select
                {...a}
                value={f.location ?? ANY}
                onValueChange={(v) => setF({ ...f, location: v === ANY ? undefined : v })}
                options={[
                  { value: ANY, label: t("anywhere") },
                  ...thProvinces.map((p) => ({ value: p.en, label: locale === "th" ? p.th : p.en })),
                ]}
              />
            )}
          </Field>
          <ToggleChips
            legend={t("workMode")}
            name="f-mode"
            options={workModes.filter((m) => m !== "ANY")}
            value={f.workMode ? [f.workMode] : []}
            onChange={(v) =>
              setF({ ...f, workMode: v[v.length - 1] === f.workMode ? undefined : v[v.length - 1] })
            }
            multiple
            label={(v) => te(`workMode.${v}`)}
          />
          <ToggleChips
            legend={t("availability")}
            name="f-avail"
            options={availabilities}
            value={f.availability ? [f.availability] : []}
            onChange={(v) =>
              setF({ ...f, availability: v[v.length - 1] === f.availability ? undefined : v[v.length - 1] })
            }
            multiple
            label={(v) => te(`availability.${v}`)}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id="f-edu" label={t("education")}>
              {(a) => (
                <Select
                  {...a}
                  value={f.educationLevel ?? ANY}
                  onValueChange={(v) =>
                    setF({
                      ...f,
                      educationLevel: v === ANY ? undefined : (v as TalentFilter["educationLevel"]),
                    })
                  }
                  options={[
                    { value: ANY, label: t("any") },
                    ...educationLevels.map((l) => ({ value: l, label: te(`education.${l}`) })),
                  ]}
                />
              )}
            </Field>
            <Field id="f-rating" label={t("rating")}>
              {(a) => (
                <Select
                  {...a}
                  value={f.minRating ? String(f.minRating) : ANY}
                  onValueChange={(v) => setF({ ...f, minRating: v === ANY ? undefined : Number(v) })}
                  options={[
                    { value: ANY, label: t("any") },
                    { value: "3", label: t("ratingAtLeast", { n: "3.0" }) },
                    { value: "4", label: t("ratingAtLeast", { n: "4.0" }) },
                    { value: "4.5", label: t("ratingAtLeast", { n: "4.5" }) },
                  ]}
                />
              )}
            </Field>
          </div>
          <div className="bg-mist flex items-center justify-between gap-4 rounded-[20px] px-4 py-3">
            <label htmlFor="f-certs" className="text-small font-medium">
              {t("hasCertificates")}
            </label>
            <Switch
              id="f-certs"
              checked={Boolean(f.hasCertificates)}
              onCheckedChange={(v) => setF({ ...f, hasCertificates: v || undefined })}
            />
          </div>
          <div className="bg-paper sticky bottom-0 flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onApply({ q: value.q });
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
            <Button type="submit">{t("apply")}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
