"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Check, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ToggleChips } from "@/components/ui/toggle-chips";
import { toast } from "@/components/ui/toaster";
import { AvatarUpload } from "@/components/able/avatar-upload";
import { MicInput, MicTextarea } from "@/components/ai/mic-field";
import { NeedForm, needToInput, type NeedDraft } from "@/components/employer/need-form";
import { countryCodes, provinceLabel, thProvinces } from "@/config/th-provinces";
import { tabSlide, useReducedMotion, variantsFor } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { orgTypes } from "@/lib/schemas/employer";
import { suggestHandle, visibilities } from "@/lib/schemas/talent";
import { checkHandle } from "@/server/talent";
import {
  finishEmployerOnboarding,
  saveNeed,
  saveOrgAbout,
  saveOrgBasics,
  saveOrgImage,
} from "@/server/employer";

export interface EmployerData {
  type: string;
  name: string;
  handle: string;
  logoUrl: string | null;
  country: string;
  province: string;
  website: string;
  employeeCount: string;
  registrationNo: string;
  description: string;
  industry: string;
  contacts: { kind: string; value: string; visibility: string }[];
  need: NeedDraft;
  email: string;
}

const STEPS = ["who", "about", "need", "review"] as const;
const ORG_CONTACTS = ["EMAIL", "PHONE", "LINE", "WEBSITE", "FACEBOOK", "LINKEDIN"] as const;

/** Employer onboarding (section 7.5): 4 steps, each saved when you continue. */
export function EmployerBuilder({ initial, hasOrg }: { initial: EmployerData; hasOrg: boolean }) {
  const t = useTranslations("employer");
  const to = useTranslations("onboard");
  const te = useTranslations("enums");
  const tco = useTranslations("countries");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [d, setD] = React.useState(initial);
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [created, setCreated] = React.useState(hasOrg);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [handleOk, setHandleOk] = React.useState<boolean | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const set = <K extends keyof EmployerData>(k: K, v: EmployerData[K]) => setD((p) => ({ ...p, [k]: v }));

  React.useEffect(() => {
    if (!d.handle) return setHandleOk(null);
    const id = setTimeout(async () => {
      const r = await checkHandle(d.handle);
      setHandleOk(r.ok ? Boolean(r.data?.available) : false);
    }, 400);
    return () => clearTimeout(id);
  }, [d.handle]);

  const getContact = (kind: string) =>
    d.contacts.find((c) => c.kind === kind) ?? {
      kind,
      value: kind === "EMAIL" ? d.email : "",
      visibility: "PUBLIC",
    };
  const putContact = (kind: string, patch: Partial<{ value: string; visibility: string }>) =>
    set("contacts", [...d.contacts.filter((c) => c.kind !== kind), { ...getContact(kind), ...patch }]);

  const save = async (i: number): Promise<boolean> => {
    const k = STEPS[i];
    if (k === "who") {
      const e: Record<string, string> = {};
      if (!d.name.trim()) e.name = to("required");
      if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(d.handle) || d.handle.length < 3)
        e.handle = to("handleFormat");
      else if (handleOk === false) e.handle = to("handleTaken");
      if (d.website && !/^https?:\/\/\S+\.\S+/.test(d.website)) e.website = t("websiteFormat");
      setErrors(e);
      if (Object.keys(e).length) {
        document.getElementById(`emp-${Object.keys(e)[0]}`)?.focus();
        return false;
      }
      const r = await saveOrgBasics({
        type: d.type,
        name: d.name,
        handle: d.handle,
        country: d.country,
        province: d.province,
        website: d.website,
        employeeCount: d.employeeCount ? Number(d.employeeCount) : null,
        registrationNo: d.registrationNo,
      });
      if (!r.ok) {
        if (r.error === "handle_taken") setErrors({ handle: to("handleTaken") });
        return false;
      }
      setCreated(true);
      if (d.logoUrl) await saveOrgImage("logo", d.logoUrl);
      return true;
    }
    if (k === "about")
      return (
        await saveOrgAbout({
          description: d.description,
          industry: d.industry,
          contacts: d.contacts.filter((c) => c.value.trim()),
        })
      ).ok;
    if (k === "need") {
      if (!d.need.title.trim()) {
        setErrors({ title: to("required") });
        document.getElementById("emp-need-title")?.focus();
        return false;
      }
      const r = await saveNeed(needToInput(d.need));
      if (!r.ok) {
        setErrors(r.error === "age_range" ? { ageMax: t("ageRangeError") } : {});
        return false;
      }
      if (r.data) set("need", { ...d.need, id: r.data.id });
      setErrors({});
      return true;
    }
    return true;
  };

  const go = async (to_: number) => {
    if (to_ > step) {
      setBusy(true);
      const ok = await save(step);
      setBusy(false);
      if (!ok) return void toast.error(to("fixErrors"));
    }
    setDir(to_ > step ? 1 : -1);
    setStep(to_);
    requestAnimationFrame(() => headingRef.current?.focus());
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  const publish = async () => {
    setBusy(true);
    const r = await finishEmployerOnboarding();
    if (!r.ok) {
      setBusy(false);
      return void toast.error(to("saveFailed"));
    }
    window.location.assign(`/${locale}/feed${r.data?.needId ? `?need=${r.data.needId}` : ""}`);
  };

  const key = STEPS[step]!;
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <p className="text-small text-graphite">{to("stepOf", { current: step + 1, total: STEPS.length })}</p>
        <div
          role="progressbar"
          aria-label={to("progress")}
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
          className="flex flex-col gap-8"
        >
          {key === "who" ? (
            <>
              <ToggleChips
                legend={t("orgType")}
                options={orgTypes}
                value={[d.type as (typeof orgTypes)[number]]}
                onChange={(v) => set("type", v[0] ?? "PRIVATE_COMPANY")}
                multiple={false}
                label={(v) => te(`orgType.${v}`)}
              />
              <section className="flex flex-col gap-3">
                <h2 className="text-small font-medium">{t("logo")}</h2>
                <AvatarUpload
                  value={d.logoUrl}
                  name={d.name || "?"}
                  onChange={(url) => set("logoUrl", url)}
                />
              </section>
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  id="emp-name"
                  label={t("orgName")}
                  error={errors.name}
                  required
                  requiredLabel={to("required")}
                >
                  {(a) => (
                    <MicInput
                      {...a}
                      label={t("orgName")}
                      maxLength={120}
                      autoComplete="organization"
                      value={d.name}
                      onValueChange={(v) => {
                        set("name", v);
                        if (!d.handle || d.handle === suggestHandle(d.name, "").replace(/-$/, ""))
                          set("handle", suggestHandle(v, "").replace(/-$/, ""));
                      }}
                    />
                  )}
                </Field>
                <Field
                  id="emp-handle"
                  label={to("handle")}
                  error={errors.handle}
                  hint={
                    handleOk && !errors.handle
                      ? `${to("handleOk")} · able.app/o/${d.handle}`
                      : `able.app/o/${d.handle || "…"}`
                  }
                  required
                  requiredLabel={to("required")}
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
                <Field id="emp-country" label={to("country")}>
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
                <Field id="emp-province" label={to("province")} optionalLabel={to("optional")}>
                  {(a) =>
                    d.country === "TH" ? (
                      <Select
                        {...a}
                        value={d.province || undefined}
                        placeholder={to("provincePlaceholder")}
                        onValueChange={(v) => set("province", v)}
                        options={thProvinces.map((p) => ({
                          value: p.en,
                          label: locale === "th" ? p.th : p.en,
                        }))}
                      />
                    ) : (
                      <Input {...a} value={d.province} onChange={(e) => set("province", e.target.value)} />
                    )
                  }
                </Field>
                <Field
                  id="emp-website"
                  label={t("website")}
                  optionalLabel={to("optional")}
                  error={errors.website}
                >
                  {(a) => (
                    <Input
                      {...a}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      value={d.website}
                      onChange={(e) => set("website", e.target.value)}
                    />
                  )}
                </Field>
                <Field id="emp-size" label={t("size")} optionalLabel={to("optional")}>
                  {(a) => (
                    <Input
                      {...a}
                      inputMode="numeric"
                      maxLength={7}
                      value={d.employeeCount}
                      onChange={(e) => set("employeeCount", e.target.value.replace(/\D/g, ""))}
                    />
                  )}
                </Field>
                <Field
                  id="emp-reg"
                  label={t("registrationNo")}
                  optionalLabel={to("optional")}
                  hint={t("registrationHint")}
                  className="md:col-span-2"
                >
                  {(a) => (
                    <Input
                      {...a}
                      maxLength={40}
                      autoComplete="off"
                      value={d.registrationNo}
                      onChange={(e) => set("registrationNo", e.target.value)}
                    />
                  )}
                </Field>
              </div>
            </>
          ) : null}

          {key === "about" ? (
            <>
              <Field id="emp-industry" label={t("industry")} optionalLabel={to("optional")}>
                {(a) => (
                  <MicInput
                    {...a}
                    label={t("industry")}
                    maxLength={80}
                    placeholder={t("industryPlaceholder")}
                    value={d.industry}
                    onValueChange={(v) => set("industry", v)}
                  />
                )}
              </Field>
              <Field id="emp-desc" label={t("description")} optionalLabel={to("optional")}>
                {(a) => (
                  <MicTextarea
                    {...a}
                    label={t("description")}
                    rows={6}
                    maxLength={2000}
                    placeholder={t("descriptionPlaceholder")}
                    value={d.description}
                    onValueChange={(v) => set("description", v)}
                    writeWithAi={() => ({
                      kind: "org",
                      displayName: d.name,
                      orgType: d.type,
                      industry: d.industry,
                      province: d.province,
                      bio: d.description,
                    })}
                  />
                )}
              </Field>
              <section className="flex flex-col gap-4">
                <div>
                  <h2 className="text-h3">{to("contacts")}</h2>
                  <p className="measure text-small text-graphite mt-1">{t("contactsHint")}</p>
                </div>
                <ul className="flex flex-col gap-3">
                  {ORG_CONTACTS.map((k) => {
                    const c = getContact(k);
                    return (
                      <li key={k} className="grid gap-3 sm:grid-cols-[1fr_minmax(0,240px)] sm:items-end">
                        <Field id={`emp-c-${k}`} label={te(`contact.${k}`)}>
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
                              onChange={(e) => putContact(k, { value: e.target.value })}
                            />
                          )}
                        </Field>
                        <Select
                          aria-label={`${to("contactVisibility")}: ${te(`contact.${k}`)}`}
                          value={c.visibility}
                          onValueChange={(v) => putContact(k, { visibility: v })}
                          options={visibilities.map((v) => ({ value: v, label: te(`visibility.${v}`) }))}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          ) : null}

          {key === "need" ? (
            <>
              <p className="measure text-graphite">{t("needLead")}</p>
              <NeedForm value={d.need} onChange={(n) => set("need", n)} errors={errors} idPrefix="emp-need" />
            </>
          ) : null}

          {key === "review" ? (
            <div className="flex flex-col gap-6">
              <section className="border-line bg-raised flex items-center gap-4 rounded-[20px] border p-5">
                {d.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.logoUrl} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span className="bg-avatar text-graphite flex size-14 items-center justify-center rounded-full">
                    <Building2 className="size-6" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-h3 truncate">{d.name}</p>
                  <p className="text-small text-graphite">
                    {te(`orgType.${d.type}`)}
                    {d.province ? ` · ${provinceLabel(d.province, locale)}` : ""}
                  </p>
                </div>
              </section>
              <section className="border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-5">
                <p className="text-caption text-graphite">{t("firstPosition")}</p>
                <p className="text-h3">{d.need.title}</p>
                <p className="text-small text-graphite flex flex-wrap items-center gap-x-2">
                  <span>{te(`workMode.${d.need.workMode}`)}</span>·
                  <span>{te(`availability.${d.need.employmentType}`)}</span>
                  {d.need.location ? (
                    <>
                      ·
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {provinceLabel(d.need.location, locale)}
                      </span>
                    </>
                  ) : null}
                </p>
                {d.need.skills.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {d.need.skills.map((s) => (
                      <li key={s} className="bg-mist text-small rounded-full px-3 py-1">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
              <p className="text-small text-graphite flex gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t("reviewNote")}
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="border-line flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={() => void go(step - 1)}>
            {to("back")}
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" loading={busy} onClick={() => void go(step + 1)}>
            {to("next")}
          </Button>
        ) : (
          <Button type="button" loading={busy} onClick={() => void publish()}>
            {t("publish")}
          </Button>
        )}
      </div>
    </div>
  );
}
