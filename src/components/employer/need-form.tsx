"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ChipInput } from "@/components/ui/chip-input";
import { ToggleChips } from "@/components/ui/toggle-chips";
import { MicInput, MicTextarea } from "@/components/ai/mic-field";
import { skillSuggestions, thProvinces } from "@/config/th-provinces";
import { availabilities, educationLevels, workModes } from "@/lib/schemas/talent";
import { setupOptions } from "@/lib/schemas/employer";
import type { NeedDraft } from "@/lib/need-draft";
export { emptyNeed, needToInput, type NeedDraft } from "@/lib/need-draft";

/** Hiring need fields (section 7.5 step 3). Salary is deliberately absent — pay is agreed in chat. */
export function NeedForm({
  value: n,
  onChange,
  errors = {},
  idPrefix = "need",
}: {
  value: NeedDraft;
  onChange: (n: NeedDraft) => void;
  errors?: Record<string, string>;
  idPrefix?: string;
}) {
  const t = useTranslations("employer");
  const to = useTranslations("onboard");
  const te = useTranslations("enums");
  const ts = useTranslations("styleguide");
  const locale = useLocale();
  const set = <K extends keyof NeedDraft>(k: K, v: NeedDraft[K]) => onChange({ ...n, [k]: v });
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <div className="flex flex-col gap-8">
      <Field
        id={id("title")}
        label={t("needTitle")}
        error={errors.title}
        required
        requiredLabel={to("required")}
      >
        {(a) => (
          <MicInput
            {...a}
            label={t("needTitle")}
            maxLength={120}
            placeholder={t("needTitlePlaceholder")}
            value={n.title}
            onValueChange={(v) => set("title", v)}
          />
        )}
      </Field>
      <Field id={id("skills")} label={t("needSkills")} hint={t("needSkillsHint")}>
        {(a) => (
          <ChipInput
            {...a}
            value={n.skills}
            onChange={(v) => set("skills", v)}
            placeholder={to("skillsPlaceholder")}
            addLabel={ts("addSkill")}
            removeLabel={(s) => ts("removeSkill", { skill: s })}
            suggestionsLabel={ts("suggested")}
            suggestions={skillSuggestions}
            max={20}
          />
        )}
      </Field>
      <ToggleChips
        legend={to("workMode")}
        name={id("mode")}
        options={workModes}
        value={[n.workMode as (typeof workModes)[number]]}
        onChange={(v) => set("workMode", v[0] ?? "ANY")}
        multiple={false}
        label={(v) => te(`workMode.${v}`)}
      />
      <ToggleChips
        legend={t("employmentType")}
        name={id("type")}
        options={availabilities}
        value={[n.employmentType as (typeof availabilities)[number]]}
        onChange={(v) => set("employmentType", v[0] ?? "FULL_TIME")}
        multiple={false}
        label={(v) => te(`availability.${v}`)}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Field id={id("location")} label={t("location")} optionalLabel={to("optional")}>
          {(a) => (
            <Select
              {...a}
              value={n.location || undefined}
              placeholder={to("provincePlaceholder")}
              onValueChange={(v) => set("location", v)}
              options={thProvinces.map((p) => ({ value: p.en, label: locale === "th" ? p.th : p.en }))}
            />
          )}
        </Field>
        <Field id={id("edu")} label={t("educationPreferred")} optionalLabel={to("optional")}>
          {(a) => (
            <Select
              {...a}
              value={n.educationLevel || "NONE"}
              onValueChange={(v) => set("educationLevel", v === "NONE" ? "" : v)}
              options={[
                { value: "NONE", label: t("noPreference") },
                ...educationLevels.map((l) => ({ value: l, label: te(`education.${l}`) })),
              ]}
            />
          )}
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-small mb-2 font-medium">
          {t("ageRange")} <span className="text-caption text-graphite font-normal">({to("optional")})</span>
        </legend>
        <div className="flex items-center gap-3">
          <Input
            aria-label={t("ageMin")}
            inputMode="numeric"
            maxLength={2}
            className="w-24"
            value={n.ageMin}
            onChange={(e) => set("ageMin", e.target.value.replace(/\D/g, ""))}
            aria-invalid={errors.ageMax ? true : undefined}
          />
          <span className="text-graphite" aria-hidden>
            –
          </span>
          <Input
            aria-label={t("ageMax")}
            inputMode="numeric"
            maxLength={2}
            className="w-24"
            value={n.ageMax}
            onChange={(e) => set("ageMax", e.target.value.replace(/\D/g, ""))}
            aria-invalid={errors.ageMax ? true : undefined}
            aria-describedby={id("age-hint")}
          />
        </div>
        <p id={id("age-hint")} className="text-caption text-graphite flex gap-1.5">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {errors.ageMax ? <span className="text-danger">{errors.ageMax}</span> : t("ageHint")}
        </p>
      </fieldset>
      <ToggleChips
        legend={t("setupOffered")}
        name={id("setup")}
        options={setupOptions}
        value={n.offeredSetup as (typeof setupOptions)[number][]}
        onChange={(v) => set("offeredSetup", v)}
        multiple
        label={(v) => te(`setup.${v}`)}
      />
      <Field id={id("desc")} label={t("needDescription")} optionalLabel={to("optional")} hint={t("payNote")}>
        {(a) => (
          <MicTextarea
            {...a}
            label={t("needDescription")}
            rows={4}
            maxLength={2000}
            value={n.description}
            onValueChange={(v) => set("description", v)}
          />
        )}
      </Field>
    </div>
  );
}
