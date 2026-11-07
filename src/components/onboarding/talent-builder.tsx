"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, FileText, Info, Loader2, Mic, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipInput } from "@/components/ui/chip-input";
import { toast } from "@/components/ui/toaster";
import { AvatarUpload } from "@/components/able/avatar-upload";
import { Link } from "@/i18n/navigation";
import { tabSlide, useReducedMotion, variantsFor } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { countryCodes, skillSuggestions, thProvinces } from "@/config/th-provinces";
import {
  availabilities,
  certKinds,
  contactKinds,
  educationLevels,
  visibilities,
  workModes,
} from "@/lib/schemas/talent";
import { toWebp, uploadFile, type UploadErr } from "@/lib/upload-client";
import {
  addCertificate,
  addPortfolioItem,
  checkHandle,
  finishOnboarding,
  removeCertificate,
  removePortfolioItem,
  saveAbout,
  saveBasics,
  saveProfileImage,
  savePrivacy,
  saveSkills,
  suggestMyHandle,
} from "@/server/talent";
import { VoiceFillSlot } from "./voice-fill-slot";

export interface BuilderData {
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  handle: string;
  dob: string;
  showAge: boolean;
  gender: string;
  country: string;
  province: string;
  headline: string;
  bio: string;
  languages: string[];
  workMode: string;
  availability: string[];
  skills: string[];
  specialTalents: string;
  educations: { level: string; school: string; field: string; yearEnd: string }[];
  certificates: {
    id: string;
    kind: string;
    title: string;
    issuer: string | null;
    issuedAt: string | null;
    fileUrl: string;
  }[];
  portfolio: { id: string; title: string; description: string | null; images: string[] }[];
  contacts: { kind: string; value: string; visibility: string }[];
  workSetupNeeds: string;
  isPublic: boolean;
  consentAi: boolean;
  consentWorkSetup: boolean;
  email: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";
const STEPS = ["basics", "about", "skills", "proof", "contact"] as const;

/** Debounced autosave: runs `fn` 700ms after the last change. */
function useAutosave<T>(
  value: T,
  fn: (v: T) => Promise<{ ok: boolean }>,
  enabled: boolean,
  setState: (s: SaveState) => void,
) {
  const first = React.useRef(true);
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const json = JSON.stringify(value);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!enabled) return;
    setState("saving");
    const id = setTimeout(async () => {
      try {
        const r = await fnRef.current(JSON.parse(json) as T);
        setState(r.ok ? "saved" : "error");
      } catch {
        setState("error");
      }
    }, 700);
    return () => clearTimeout(id);
  }, [json, enabled, setState]);
}

export function TalentBuilder({ initial, hasProfile }: { initial: BuilderData; hasProfile: boolean }) {
  const t = useTranslations("onboard");
  const reduced = useReducedMotion();
  const [d, setD] = React.useState<BuilderData>(initial);
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [save, setSave] = React.useState<SaveState>("idle");
  const [created, setCreated] = React.useState(hasProfile);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [done, setDone] = React.useState<string | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof BuilderData>(k: K, v: BuilderData[K]) => setD((p) => ({ ...p, [k]: v }));

  const basics = {
    firstName: d.firstName,
    lastName: d.lastName,
    displayName: d.displayName,
    handle: d.handle,
    dob: d.dob || null,
    showAge: d.showAge,
    gender: d.gender || null,
    country: d.country,
    province: d.province || null,
  };
  const basicsValid =
    d.firstName.trim() &&
    d.lastName.trim() &&
    d.displayName.trim() &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(d.handle) &&
    d.handle.length >= 3;
  useAutosave(
    basics,
    async (v) => {
      const r = await saveBasics(v);
      if (r.ok) setCreated(true);
      else if (r.error === "handle_taken") setErrors((e) => ({ ...e, handle: t("handleTaken") }));
      return r;
    },
    Boolean(basicsValid),
    setSave,
  );
  useAutosave(
    {
      headline: d.headline,
      bio: d.bio,
      languages: d.languages,
      workMode: d.workMode,
      availability: d.availability,
    },
    saveAbout,
    created,
    setSave,
  );
  useAutosave(
    {
      skills: d.skills,
      specialTalents: d.specialTalents,
      educations: d.educations
        .filter((e) => e.school.trim())
        .map((e) => ({
          level: e.level,
          school: e.school,
          field: e.field,
          yearEnd: e.yearEnd ? Number(e.yearEnd) : null,
        })),
    },
    saveSkills,
    created,
    setSave,
  );
  useAutosave(
    {
      contacts: d.contacts.filter((c) => c.value.trim()),
      workSetupNeeds: d.workSetupNeeds,
      isPublic: d.isPublic,
      consentAi: d.consentAi,
      consentWorkSetup: d.consentWorkSetup,
    },
    savePrivacy,
    created,
    setSave,
  );

  // Suggest a handle from the name once.
  React.useEffect(() => {
    if (d.handle || !d.firstName || !d.lastName) return;
    const id = setTimeout(async () => set("handle", await suggestMyHandle(d.firstName, d.lastName)), 600);
    return () => clearTimeout(id);
  }, [d.firstName, d.lastName, d.handle]);

  // Flush the step being left so quick navigation never outruns the debounced autosave.
  const flush = async (i: number) => {
    const k = STEPS[i];
    if (k === "basics") {
      const r = await saveBasics(basics);
      if (r.ok) setCreated(true);
      return r.ok;
    }
    if (k === "about")
      return (
        await saveAbout({
          headline: d.headline,
          bio: d.bio,
          languages: d.languages,
          workMode: d.workMode,
          availability: d.availability,
        })
      ).ok;
    if (k === "skills")
      return (
        await saveSkills({
          skills: d.skills,
          specialTalents: d.specialTalents,
          educations: d.educations
            .filter((e) => e.school.trim())
            .map((e) => ({
              level: e.level,
              school: e.school,
              field: e.field,
              yearEnd: e.yearEnd ? Number(e.yearEnd) : null,
            })),
        })
      ).ok;
    if (k === "contact")
      return (
        await savePrivacy({
          contacts: d.contacts.filter((c) => c.value.trim()),
          workSetupNeeds: d.workSetupNeeds,
          isPublic: d.isPublic,
          consentAi: d.consentAi,
          consentWorkSetup: d.consentWorkSetup,
        })
      ).ok;
    return true;
  };

  const go = async (to: number) => {
    if (to > step && step === 0) {
      const e: Record<string, string> = {};
      if (!d.firstName.trim()) e.firstName = t("required");
      if (!d.lastName.trim()) e.lastName = t("required");
      if (!d.displayName.trim()) e.displayName = t("required");
      if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(d.handle) || d.handle.length < 3)
        e.handle = t("handleFormat");
      if (errors.handle === t("handleTaken")) e.handle = t("handleTaken");
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error(t("fixErrors"));
        document.getElementById(`ob-${Object.keys(e)[0]}`)?.focus();
        return;
      }
    }
    setSave("saving");
    const ok = await flush(step);
    setSave(ok ? "saved" : "error");
    if (!ok && step === 0) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    requestAnimationFrame(() => headingRef.current?.focus());
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  const finish = async () => {
    await flush(step);
    const r = await finishOnboarding();
    if (r.ok && r.data) setDone(r.data.handle);
    else toast.error(t("saveFailed"));
  };

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4 py-10" role="status">
        <CheckCircle2 className="text-success size-10" aria-hidden />
        <h1 className="text-h1 tracking-display">{t("doneTitle")}</h1>
        <p className="measure text-graphite">{t("doneBody")}</p>
        <Button asChild size="lg">
          <Link href="/me">{t("viewProfile")}</Link>
        </Button>
      </div>
    );
  }

  const key = STEPS[step]!;
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-small text-graphite">
            {t("stepOf", { current: step + 1, total: STEPS.length })}
          </p>
          <p className="text-caption text-graphite flex items-center gap-1.5" aria-live="polite">
            {save === "saving" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {t("autosaving")}
              </>
            ) : save === "saved" ? (
              <>
                <Check className="text-success size-3.5" aria-hidden />
                {t("autosaved")}
              </>
            ) : save === "error" ? (
              <span className="text-danger">{t("saveFailed")}</span>
            ) : null}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={t("progress")}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          className="bg-mist h-1.5 overflow-hidden rounded-full"
        >
          <div
            className="bg-ink ease-smooth h-full origin-left rounded-full transition-transform duration-300"
            style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }}
          />
        </div>
        <ol className="no-scrollbar -mx-1 hidden gap-1 overflow-x-auto md:flex">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => (i < step || created ? void go(i) : undefined)}
                aria-current={i === step ? "step" : undefined}
                disabled={i > step && !created}
                className={cn(
                  "text-small flex min-h-11 items-center gap-2 rounded-full px-3 whitespace-nowrap",
                  i === step
                    ? "bg-mist text-ink font-medium"
                    : "text-graphite hover:text-ink disabled:opacity-50",
                )}
              >
                <span
                  className={cn(
                    "text-caption flex size-6 items-center justify-center rounded-full",
                    i < step ? "bg-ink text-paper" : "border-field-line border",
                  )}
                >
                  {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                {t(`steps.${s}`)}
              </button>
            </li>
          ))}
        </ol>
        <h1 ref={headingRef} tabIndex={-1} className="text-h1 tracking-display focus:outline-none">
          {t(`steps.${key}`)}
        </h1>
      </header>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={key}
          custom={dir}
          variants={variantsFor(tabSlide, reduced)}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {key === "basics" ? (
            <StepBasics d={d} set={set} errors={errors} setErrors={setErrors} />
          ) : key === "about" ? (
            <StepAbout d={d} set={set} />
          ) : key === "skills" ? (
            <StepSkills d={d} set={set} />
          ) : key === "proof" ? (
            <StepProof d={d} set={set} />
          ) : (
            <StepContact d={d} set={set} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="border-line flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => void go(step - 1)}>
            {t("back")}
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => void go(step + 1)}>
            {t("next")}
          </Button>
        ) : (
          <Button type="button" onClick={() => void finish()} disabled={!created}>
            {t("finish")}
          </Button>
        )}
      </div>
    </div>
  );
}

type StepProps = { d: BuilderData; set: <K extends keyof BuilderData>(k: K, v: BuilderData[K]) => void };

function StepBasics({
  d,
  set,
  errors,
  setErrors,
}: StepProps & {
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const t = useTranslations("onboard");
  const te = useTranslations("enums");
  const tco = useTranslations("countries");
  const locale = useLocale();
  const [handleOk, setHandleOk] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!d.handle) return setHandleOk(null);
    const id = setTimeout(async () => {
      const r = await checkHandle(d.handle);
      if (!r.ok) {
        setHandleOk(false);
        setErrors((e) => ({ ...e, handle: t("handleFormat") }));
      } else {
        setHandleOk(Boolean(r.data?.available));
        setErrors((e) => {
          const { handle: _h, ...rest } = e;
          return r.data?.available ? rest : { ...rest, handle: t("handleTaken") };
        });
      }
    }, 400);
    return () => clearTimeout(id);
  }, [d.handle, setErrors, t]);

  const req = { required: true, requiredLabel: t("required") };
  return (
    <div className="flex flex-col gap-8">
      <VoiceFillSlot />
      <section className="flex flex-col gap-3">
        <h2 className="text-small font-medium">{t("photo")}</h2>
        <AvatarUpload
          value={d.avatarUrl}
          name={d.displayName || `${d.firstName} ${d.lastName}`}
          onChange={async (url) => {
            const r = await saveProfileImage("avatar", url ?? "");
            if (r.ok) set("avatarUrl", url);
            else toast.error(t("saveFailed"));
          }}
        />
        <p className="text-caption text-graphite">{t("photoHint")}</p>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <Field id="ob-firstName" label={t("firstName")} error={errors.firstName} {...req}>
          {(a) => (
            <Input
              {...a}
              autoComplete="given-name"
              value={d.firstName}
              onChange={(e) => {
                set("firstName", e.target.value);
                if (!d.displayName || d.displayName === `${d.firstName} ${d.lastName}`.trim())
                  set("displayName", `${e.target.value} ${d.lastName}`.trim());
              }}
            />
          )}
        </Field>
        <Field id="ob-lastName" label={t("lastName")} error={errors.lastName} {...req}>
          {(a) => (
            <Input
              {...a}
              autoComplete="family-name"
              value={d.lastName}
              onChange={(e) => {
                set("lastName", e.target.value);
                if (!d.displayName || d.displayName === `${d.firstName} ${d.lastName}`.trim())
                  set("displayName", `${d.firstName} ${e.target.value}`.trim());
              }}
            />
          )}
        </Field>
        <Field
          id="ob-displayName"
          label={t("displayName")}
          hint={t("displayNameHint")}
          error={errors.displayName}
          {...req}
        >
          {(a) => (
            <Input
              {...a}
              autoComplete="nickname"
              value={d.displayName}
              onChange={(e) => set("displayName", e.target.value)}
            />
          )}
        </Field>
        <Field
          id="ob-handle"
          label={t("handle")}
          hint={
            handleOk && !errors.handle
              ? `${t("handleOk")} · ${t("handleHint", { handle: d.handle })}`
              : t("handleHint", { handle: d.handle || "…" })
          }
          error={errors.handle}
          {...req}
        >
          {(a) => (
            <Input
              {...a}
              autoCapitalize="none"
              spellCheck={false}
              value={d.handle}
              onChange={(e) =>
                set(
                  "handle",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 30),
                )
              }
            />
          )}
        </Field>
        <Field id="ob-dob" label={t("dob")} hint={t("dobHint")} optionalLabel={t("optional")}>
          {(a) => (
            <DatePicker
              {...a}
              value={d.dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set("dob", e.target.value)}
            />
          )}
        </Field>
        <div className="bg-mist flex items-center justify-between gap-4 self-end rounded-[20px] px-4 py-3">
          <label htmlFor="ob-showAge" className="text-small font-medium">
            {t("showAge")}
          </label>
          <Switch id="ob-showAge" checked={d.showAge} onCheckedChange={(v) => set("showAge", v)} />
        </div>
        <Field id="ob-gender" label={t("gender")} hint={t("genderHint")} optionalLabel={t("optional")}>
          {(a) => (
            <Select
              {...a}
              value={d.gender || "PREFER_NOT"}
              onValueChange={(v) => set("gender", v)}
              options={["PREFER_NOT", "FEMALE", "MALE", "NON_BINARY", "SELF_DESCRIBE"].map((g) => ({
                value: g,
                label: te(`gender.${g}`),
              }))}
            />
          )}
        </Field>
        <Field id="ob-country" label={t("country")}>
          {(a) => (
            <Select
              {...a}
              value={d.country}
              onValueChange={(v) => {
                set("country", v);
                set("province", "");
              }}
              options={countryCodes.map((c) => ({ value: c, label: tco(c) }))}
            />
          )}
        </Field>
        <Field id="ob-province" label={t("province")} optionalLabel={t("optional")} className="md:col-span-2">
          {(a) =>
            d.country === "TH" ? (
              <Select
                {...a}
                value={d.province || undefined}
                placeholder={t("provincePlaceholder")}
                onValueChange={(v) => set("province", v)}
                options={thProvinces.map((p) => ({ value: p.en, label: locale === "th" ? p.th : p.en }))}
              />
            ) : (
              <Input {...a} value={d.province} onChange={(e) => set("province", e.target.value)} />
            )
          }
        </Field>
      </div>
    </div>
  );
}

function ToggleChips<T extends string>({
  legend,
  options,
  value,
  onChange,
  multiple,
  label,
}: {
  legend: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  multiple: boolean;
  label: (v: T) => string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-small mb-2 font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <label
              key={o}
              className={cn(
                "text-small has-[:focus-visible]:outline-brand flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                on ? "border-ink bg-ink text-paper" : "border-field-line hover:bg-mist",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                className="sr-only"
                checked={on}
                name={legend}
                onChange={() =>
                  onChange(multiple ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])
                }
              />
              {on ? <Check className="size-4" aria-hidden /> : null}
              {label(o)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function StepAbout({ d, set }: StepProps) {
  const t = useTranslations("onboard");
  const te = useTranslations("enums");
  const ts = useTranslations("styleguide");
  return (
    <div className="flex flex-col gap-8">
      <Field id="ob-headline" label={t("headline")} optionalLabel={t("optional")}>
        {(a) => (
          <Input
            {...a}
            maxLength={120}
            placeholder={t("headlinePlaceholder")}
            value={d.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
        )}
      </Field>
      <Field id="ob-bio" label={t("bio")} optionalLabel={t("optional")}>
        {(a) => (
          <Textarea
            {...a}
            rows={6}
            maxLength={2000}
            placeholder={t("bioPlaceholder")}
            value={d.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        )}
      </Field>
      <Field id="ob-languages" label={t("languages")}>
        {(a) => (
          <ChipInput
            {...a}
            value={d.languages}
            onChange={(v) => set("languages", v)}
            placeholder={t("languagesPlaceholder")}
            addLabel={t("languagesPlaceholder")}
            removeLabel={(s) => ts("removeSkill", { skill: s })}
            suggestions={[
              "Thai",
              "English",
              "Thai Sign Language",
              "Mandarin Chinese",
              "Japanese",
              "Lao",
              "Burmese",
              "Malay",
            ]}
            max={10}
          />
        )}
      </Field>
      <ToggleChips
        legend={t("workMode")}
        options={workModes}
        value={[d.workMode as (typeof workModes)[number]]}
        onChange={(v) => set("workMode", v[0] ?? "ANY")}
        multiple={false}
        label={(v) => te(`workMode.${v}`)}
      />
      <ToggleChips
        legend={t("availability")}
        options={availabilities}
        value={d.availability as (typeof availabilities)[number][]}
        onChange={(v) => set("availability", v)}
        multiple
        label={(v) => te(`availability.${v}`)}
      />
    </div>
  );
}

function StepSkills({ d, set }: StepProps) {
  const t = useTranslations("onboard");
  const te = useTranslations("enums");
  const ts = useTranslations("styleguide");
  const upd = (i: number, k: keyof BuilderData["educations"][number], v: string) =>
    set(
      "educations",
      d.educations.map((e, j) => (j === i ? { ...e, [k]: v } : e)),
    );
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-h3">{t("education")}</h2>
        {d.educations.map((e, i) => (
          <div
            key={i}
            className="border-line bg-raised grid gap-4 rounded-[20px] border p-4 md:grid-cols-2 md:p-5"
          >
            <Field id={`ob-edu-level-${i}`} label={t("level")}>
              {(a) => (
                <Select
                  {...a}
                  value={e.level}
                  onValueChange={(v) => upd(i, "level", v)}
                  options={educationLevels.map((l) => ({ value: l, label: te(`education.${l}`) }))}
                />
              )}
            </Field>
            <Field id={`ob-edu-school-${i}`} label={t("school")}>
              {(a) => <Input {...a} value={e.school} onChange={(ev) => upd(i, "school", ev.target.value)} />}
            </Field>
            <Field id={`ob-edu-field-${i}`} label={t("field")} optionalLabel={t("optional")}>
              {(a) => <Input {...a} value={e.field} onChange={(ev) => upd(i, "field", ev.target.value)} />}
            </Field>
            <div className="flex items-end gap-3">
              <Field
                id={`ob-edu-year-${i}`}
                label={t("yearEnd")}
                optionalLabel={t("optional")}
                className="flex-1"
              >
                {(a) => (
                  <Input
                    {...a}
                    inputMode="numeric"
                    maxLength={4}
                    value={e.yearEnd}
                    onChange={(ev) => upd(i, "yearEnd", ev.target.value.replace(/\D/g, ""))}
                  />
                )}
              </Field>
              <Button
                type="button"
                variant="ghost"
                aria-label={`${t("remove")}: ${e.school || t("education")}`}
                onClick={() =>
                  set(
                    "educations",
                    d.educations.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          onClick={() =>
            set("educations", [...d.educations, { level: "BACHELOR", school: "", field: "", yearEnd: "" }])
          }
        >
          <Plus aria-hidden />
          {t("addEducation")}
        </Button>
      </section>
      <Field id="ob-skills" label={t("skills")}>
        {(a) => (
          <ChipInput
            {...a}
            value={d.skills}
            onChange={(v) => set("skills", v)}
            placeholder={t("skillsPlaceholder")}
            addLabel={ts("addSkill")}
            removeLabel={(s) => ts("removeSkill", { skill: s })}
            suggestionsLabel={ts("suggested")}
            suggestions={skillSuggestions}
          />
        )}
      </Field>
      <Field
        id="ob-special"
        label={t("specialTalents")}
        hint={t("specialTalentsHint")}
        optionalLabel={t("optional")}
      >
        {(a) => (
          <Textarea
            {...a}
            rows={3}
            maxLength={500}
            value={d.specialTalents}
            onChange={(e) => set("specialTalents", e.target.value)}
          />
        )}
      </Field>
    </div>
  );
}

function useUploadError() {
  const t = useTranslations("onboard");
  return (e: UploadErr) => toast.error(t(`uploadErrors.${e}`));
}

function StepProof({ d, set }: StepProps) {
  const t = useTranslations("onboard");
  const te = useTranslations("enums");
  const uploadErr = useUploadError();
  const [cert, setCert] = React.useState({
    kind: "TRAINING",
    title: "",
    issuer: "",
    issuedAt: "",
    fileUrl: "",
    fileName: "",
  });
  const [pf, setPf] = React.useState({
    title: "",
    description: "",
    link: "",
    images: [] as string[],
    alt: "",
  });
  const [busy, setBusy] = React.useState<string | null>(null);

  const uploadCert = async (f: File | undefined) => {
    if (!f) return;
    setBusy("cert");
    const blob = f.type === "application/pdf" ? f : await toWebp(f);
    const r = await uploadFile("certificates", blob, { name: f.name });
    setBusy(null);
    if (!r.ok) return uploadErr(r.error);
    setCert((c) => ({ ...c, fileUrl: r.url, fileName: f.name }));
  };
  const saveCert = async () => {
    if (!cert.title.trim() || !cert.fileUrl) return;
    setBusy("certSave");
    const r = await addCertificate({
      kind: cert.kind,
      title: cert.title,
      issuer: cert.issuer,
      issuedAt: cert.issuedAt || null,
      fileUrl: cert.fileUrl,
      isPublic: true,
    });
    setBusy(null);
    if (!r.ok || !r.data) return toast.error(t("saveFailed"));
    set("certificates", [
      ...d.certificates,
      {
        id: r.data.id,
        kind: cert.kind,
        title: cert.title,
        issuer: cert.issuer || null,
        issuedAt: cert.issuedAt || null,
        fileUrl: cert.fileUrl,
      },
    ]);
    setCert({ kind: "TRAINING", title: "", issuer: "", issuedAt: "", fileUrl: "", fileName: "" });
  };
  const uploadPf = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy("pf");
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 10 - pf.images.length)) {
      const r = await uploadFile("posts", await toWebp(f), { name: f.name });
      if (r.ok) urls.push(r.url);
      else uploadErr(r.error);
    }
    setBusy(null);
    setPf((p) => ({ ...p, images: [...p.images, ...urls] }));
  };
  const savePf = async () => {
    if (!pf.title.trim()) return;
    setBusy("pfSave");
    const r = await addPortfolioItem({
      title: pf.title,
      description: pf.description,
      link: pf.link || null,
      images: pf.images,
      imageAlts: pf.images.map(() => pf.alt || pf.title),
    });
    setBusy(null);
    if (!r.ok || !r.data) return toast.error(t("saveFailed"));
    set("portfolio", [
      ...d.portfolio,
      { id: r.data.id, title: pf.title, description: pf.description || null, images: pf.images },
    ]);
    setPf({ title: "", description: "", link: "", images: [], alt: "" });
  };

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h2 className="text-h3">{t("certificates")}</h2>
        {d.certificates.length ? (
          <ul className="flex flex-col gap-2">
            {d.certificates.map((c) => (
              <li
                key={c.id}
                className="border-line bg-raised flex items-center gap-3 rounded-[20px] border p-4"
              >
                <FileText className="text-graphite size-5 shrink-0" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{c.title}</span>
                  <span className="text-caption text-graphite truncate">
                    {te(`cert.${c.kind}`)}
                    {c.issuer ? ` · ${c.issuer}` : ""}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${t("remove")}: ${c.title}`}
                  onClick={async () => {
                    const r = await removeCertificate(c.id);
                    if (r.ok)
                      set(
                        "certificates",
                        d.certificates.filter((x) => x.id !== c.id),
                      );
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="border-line grid gap-4 rounded-[20px] border border-dashed p-4 md:grid-cols-2 md:p-5">
          <Field id="ob-cert-kind" label={t("certKind")}>
            {(a) => (
              <Select
                {...a}
                value={cert.kind}
                onValueChange={(v) => setCert({ ...cert, kind: v })}
                options={certKinds.map((k) => ({ value: k, label: te(`cert.${k}`) }))}
              />
            )}
          </Field>
          <Field id="ob-cert-title" label={t("certTitle")}>
            {(a) => (
              <Input
                {...a}
                value={cert.title}
                onChange={(e) => setCert({ ...cert, title: e.target.value })}
              />
            )}
          </Field>
          <Field id="ob-cert-issuer" label={t("certIssuer")} optionalLabel={t("optional")}>
            {(a) => (
              <Input
                {...a}
                value={cert.issuer}
                onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
              />
            )}
          </Field>
          <Field id="ob-cert-date" label={t("certDate")} optionalLabel={t("optional")}>
            {(a) => (
              <DatePicker
                {...a}
                value={cert.issuedAt}
                onChange={(e) => setCert({ ...cert, issuedAt: e.target.value })}
              />
            )}
          </Field>
          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-small font-medium">{t("certFile")}</span>
            <label className="border-field-line hover:bg-mist text-small has-[:focus-visible]:outline-brand flex min-h-12 cursor-pointer items-center gap-2 rounded-[14px] border px-4 has-[:focus-visible]:outline-2">
              {busy === "cert" ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-5" aria-hidden />
              )}
              <span className="truncate">{cert.fileName || t("certHint")}</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="sr-only"
                onChange={(e) => void uploadCert(e.target.files?.[0])}
              />
            </label>
          </div>
          <Button
            type="button"
            className="md:col-span-2 md:justify-self-start"
            onClick={() => void saveCert()}
            disabled={!cert.title.trim() || !cert.fileUrl}
            loading={busy === "certSave"}
          >
            <Plus aria-hidden />
            {t("addCert")}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h3">{t("portfolio")}</h2>
        {d.portfolio.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {d.portfolio.map((p) => (
              <li
                key={p.id}
                className="border-line bg-raised flex items-center gap-3 rounded-[20px] border p-3"
              >
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="size-14 shrink-0 rounded-[12px] object-cover" />
                ) : null}
                <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${t("remove")}: ${p.title}`}
                  onClick={async () => {
                    const r = await removePortfolioItem(p.id);
                    if (r.ok)
                      set(
                        "portfolio",
                        d.portfolio.filter((x) => x.id !== p.id),
                      );
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="border-line grid gap-4 rounded-[20px] border border-dashed p-4 md:grid-cols-2 md:p-5">
          <Field id="ob-pf-title" label={t("pfTitle")}>
            {(a) => (
              <Input {...a} value={pf.title} onChange={(e) => setPf({ ...pf, title: e.target.value })} />
            )}
          </Field>
          <Field id="ob-pf-link" label={t("pfLink")} optionalLabel={t("optional")}>
            {(a) => (
              <Input
                {...a}
                type="url"
                inputMode="url"
                value={pf.link}
                onChange={(e) => setPf({ ...pf, link: e.target.value })}
              />
            )}
          </Field>
          <Field
            id="ob-pf-desc"
            label={t("pfDescription")}
            optionalLabel={t("optional")}
            className="md:col-span-2"
          >
            {(a) => (
              <Textarea
                {...a}
                rows={3}
                value={pf.description}
                onChange={(e) => setPf({ ...pf, description: e.target.value })}
              />
            )}
          </Field>
          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-small font-medium">{t("pfImages")}</span>
            <div className="flex flex-wrap gap-2">
              {pf.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="size-20 rounded-[12px] object-cover" />
              ))}
              <label className="border-field-line hover:bg-mist has-[:focus-visible]:outline-brand flex size-20 cursor-pointer items-center justify-center rounded-[12px] border has-[:focus-visible]:outline-2">
                {busy === "pf" ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-5" aria-hidden />
                )}
                <span className="sr-only">{t("pfImages")}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => void uploadPf(e.target.files)}
                />
              </label>
            </div>
          </div>
          {pf.images.length ? (
            <Field id="ob-pf-alt" label={t("pfAlt")} optionalLabel={t("optional")} className="md:col-span-2">
              {(a) => <Input {...a} value={pf.alt} onChange={(e) => setPf({ ...pf, alt: e.target.value })} />}
            </Field>
          ) : null}
          <Button
            type="button"
            className="md:col-span-2 md:justify-self-start"
            onClick={() => void savePf()}
            disabled={!pf.title.trim()}
            loading={busy === "pfSave"}
          >
            <Plus aria-hidden />
            {t("addPortfolio")}
          </Button>
        </div>
      </section>
    </div>
  );
}

function StepContact({ d, set }: StepProps) {
  const t = useTranslations("onboard");
  const te = useTranslations("enums");
  const get = (kind: string) =>
    d.contacts.find((c) => c.kind === kind) ?? {
      kind,
      value: kind === "EMAIL" ? d.email : "",
      visibility: "CHAT_ONLY",
    };
  const put = (kind: string, patch: Partial<{ value: string; visibility: string }>) => {
    const cur = get(kind);
    const next = { ...cur, ...patch };
    set("contacts", [...d.contacts.filter((c) => c.kind !== kind), next]);
  };
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-h3">{t("contacts")}</h2>
          <p className="measure text-small text-graphite mt-1">{t("contactsHint")}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {contactKinds.map((k) => {
            const c = get(k);
            return (
              <li key={k} className="grid gap-3 sm:grid-cols-[1fr_minmax(0,240px)] sm:items-end">
                <Field id={`ob-c-${k}`} label={te(`contact.${k}`)}>
                  {(a) => (
                    <Input
                      {...a}
                      type={
                        k === "EMAIL"
                          ? "email"
                          : k === "PHONE"
                            ? "tel"
                            : k === "WEBSITE" || k === "LINKEDIN"
                              ? "url"
                              : "text"
                      }
                      value={c.value}
                      onChange={(e) => put(k, { value: e.target.value })}
                    />
                  )}
                </Field>
                <Select
                  aria-label={`${t("contactVisibility")}: ${te(`contact.${k}`)}`}
                  value={c.visibility}
                  onValueChange={(v) => put(k, { visibility: v })}
                  options={visibilities.map((v) => ({ value: v, label: te(`visibility.${v}`) }))}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-line bg-raised flex flex-col gap-4 rounded-[20px] border p-5">
        <h2 className="text-h3">{t("workSetup")}</h2>
        <p className="measure text-small text-graphite flex gap-2">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("workSetupHint")}
        </p>
        <label className="text-small flex items-start gap-3">
          <Checkbox
            checked={d.consentWorkSetup}
            onCheckedChange={(v) => set("consentWorkSetup", v === true)}
          />
          <span>{t("consentWorkSetup")}</span>
        </label>
        <Field id="ob-worksetup" label={t("workSetup")} optionalLabel={t("optional")}>
          {(a) => (
            <Textarea
              {...a}
              rows={3}
              maxLength={500}
              disabled={!d.consentWorkSetup}
              placeholder={t("workSetupPlaceholder")}
              value={d.workSetupNeeds}
              onChange={(e) => set("workSetupNeeds", e.target.value)}
            />
          )}
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <div className="bg-mist flex items-center justify-between gap-4 rounded-[20px] px-4 py-3">
          <label htmlFor="ob-public" className="text-small font-medium">
            {t("profilePublic")}
          </label>
          <Switch id="ob-public" checked={d.isPublic} onCheckedChange={(v) => set("isPublic", v)} />
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend className="text-small mb-1 font-medium">{t("consentTitle")}</legend>
          <label className="text-small flex items-start gap-3">
            <Checkbox checked={d.consentAi} onCheckedChange={(v) => set("consentAi", v === true)} />
            <span className="flex items-start gap-1.5">
              <Mic className="text-graphite mt-0.5 size-4 shrink-0" aria-hidden />
              {t("consentAi")}
            </span>
          </label>
        </fieldset>
      </section>
    </div>
  );
}
