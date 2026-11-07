"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Inbox, Star, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { ChipInput } from "@/components/ui/chip-input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { RatingInput, RatingStars } from "@/components/ui/rating-stars";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toaster";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { EmptyState } from "@/components/able/empty-state";
import { StatRow } from "@/components/able/stat-row";
import { ProgressPill } from "@/components/able/progress-pill";

const tokens = [
  "paper",
  "mist",
  "cloud",
  "line",
  "ink",
  "graphite",
  "muted",
  "brand",
  "brand-soft",
  "star",
  "success",
  "danger",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

export function Styleguide() {
  const t = useTranslations("styleguide");
  const tc = useTranslations("common");
  const [skills, setSkills] = React.useState<string[]>([]);
  React.useEffect(() => setSkills([t("skillA"), t("skillB")]), [t]);
  const [rating, setRating] = React.useState(4);
  const [showAge, setShowAge] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);

  return (
    <div className="flex flex-col gap-14">
      <Section title={t("colors")}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {tokens.map((tok) => (
            <li key={tok} className="flex flex-col gap-2">
              <span className="border-line h-16 rounded-2xl border" style={{ background: `var(--${tok})` }} />
              <code className="text-caption text-graphite">--{tok}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("type")}>
        <div className="flex flex-col gap-3">
          <p className="text-display tracking-display">Work that fits you.</p>
          <p className="text-h1 tracking-display">งานที่ใช่ สำหรับทุกคน</p>
          <p className="text-h2">{t("h2")}</p>
          <p className="text-h3">{t("h3")}</p>
          <p className="measure">{t("typeBody")}</p>
          <p className="text-small text-graphite">{t("typeSmall")}</p>
          <p className="text-caption text-graphite">{t("typeCaption")}</p>
        </div>
      </Section>

      <Section title={t("buttons")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button>{t("primary")}</Button>
          <Button variant="secondary">{t("secondary")}</Button>
          <Button variant="ghost">{t("ghost")}</Button>
          <Button variant="destructive">
            <Trash2 aria-hidden />
            {t("destructive")}
          </Button>
          <Button loading>{tc("saving")}</Button>
          <IconButton aria-label={t("star")} variant="soft">
            <Star aria-hidden />
          </IconButton>
          <IconButton aria-label={t("like")} variant="outline">
            <Heart aria-hidden />
          </IconButton>
        </div>
      </Section>

      <Section title={t("inputs")}>
        <div className="grid max-w-2xl gap-6 md:grid-cols-2">
          <Field
            id="sg-name"
            label={t("nameLabel")}
            hint={t("nameHint")}
            required
            requiredLabel={tc("required")}
          >
            {(a) => <Input {...a} placeholder={t("namePlaceholder")} />}
          </Field>
          <Field
            id="sg-name-err"
            label={t("nameLabel")}
            error={t("errorExample")}
            required
            requiredLabel={tc("required")}
          >
            {(a) => <Input {...a} />}
          </Field>
          <Field id="sg-date" label={t("dateLabel")} optionalLabel={tc("optional")}>
            {(a) => <DatePicker {...a} />}
          </Field>
          <Field id="sg-select" label={t("selectLabel")}>
            {(a) => (
              <Select
                {...a}
                placeholder={t("selectPlaceholder")}
                options={[
                  { value: "REMOTE", label: t("remote") },
                  { value: "ONSITE", label: t("onsite") },
                  { value: "HYBRID", label: t("hybrid") },
                ]}
              />
            )}
          </Field>
          <Field id="sg-bio" label={t("bioLabel")} className="md:col-span-2">
            {(a) => <Textarea {...a} placeholder={t("bioPlaceholder")} />}
          </Field>
          <div className="bg-mist flex items-center justify-between gap-4 rounded-[20px] px-4 py-3 md:col-span-2">
            <label htmlFor="sg-age" className="text-small font-medium">
              {t("switchLabel")}
            </label>
            <Switch id="sg-age" checked={showAge} onCheckedChange={setShowAge} />
          </div>
        </div>
      </Section>

      <Section title={t("chips")}>
        <div className="max-w-2xl">
          <Field id="sg-skills" label={t("skillsLabel")}>
            {(a) => (
              <ChipInput
                {...a}
                value={skills}
                onChange={setSkills}
                placeholder={t("skillsPlaceholder")}
                addLabel={t("addSkill")}
                removeLabel={(s) => t("removeSkill", { skill: s })}
                suggestionsLabel={t("suggested")}
                suggestions={[t("sugg1"), t("sugg2"), t("sugg3"), t("sugg4"), t("sugg5")]}
              />
            )}
          </Field>
        </div>
      </Section>

      <Section title={t("feedback")}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2">
              <Avatar name="Mali Srisuk" size="md" />
              <span className="font-medium">Mali Srisuk</span>
              <VerifiedBadge tier={1} />
            </span>
            <span className="flex items-center gap-2">
              <Avatar name="Green Leaf Co." size="md" />
              <span className="font-medium">Green Leaf Co.</span>
              <VerifiedBadge tier={2} />
            </span>
            <RatingStars value={4.6} label={t("rating", { value: 4.6 })} />
          </div>
          <RatingInput
            value={rating}
            onChange={setRating}
            legend={t("rating", { value: rating })}
            starLabel={(n) => t("starN", { n })}
          />
          <StatRow
            stats={[
              { label: t("statRating"), value: "★ 4.8 (23)" },
              { label: t("statJobs"), value: 31 },
              { label: t("statRehired"), value: 9 },
              { label: t("statResponse"), value: t("responseValue") },
            ]}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => toast.success(t("toastText"))}>
              {t("toast")}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <EmptyState icon={Inbox} title={t("emptyTitle")} body={t("emptyBody")} />
        </div>
      </Section>

      <Section title={t("overlays")}>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">{t("openDialog")}</Button>
            </DialogTrigger>
            <DialogContent title={t("dialogTitle")} closeLabel={tc("close")}>
              <p className="text-graphite">{t("dialogBody")}</p>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">{t("openSheet")}</Button>
            </SheetTrigger>
            <SheetContent title={t("sheetTitle")} closeLabel={tc("close")}>
              <p className="text-graphite">{t("sheetBody")}</p>
            </SheetContent>
          </Sheet>
          <Button variant="destructive" onClick={() => setConfirm(true)}>
            {t("confirm")}
          </Button>
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title={t("confirmTitle")}
            description={t("confirmBody")}
            confirmLabel={tc("delete")}
            cancelLabel={tc("cancel")}
            closeLabel={tc("close")}
            destructive
            onConfirm={() => setConfirm(false)}
          />
        </div>
        <Tabs
          label={t("tabsLabel")}
          items={[
            { value: "a", label: t("tabA"), count: 12 },
            { value: "b", label: t("tabB") },
            { value: "c", label: t("tabC") },
          ]}
        >
          <TabPanel value="a">
            <p className="text-graphite">{t("tabAText")}</p>
          </TabPanel>
          <TabPanel value="b">
            <p className="text-graphite">{t("tabBText")}</p>
          </TabPanel>
          <TabPanel value="c">
            <p className="text-graphite">{t("tabCText")}</p>
          </TabPanel>
        </Tabs>
      </Section>

      <Section title={t("faqTitle")}>
        <Accordion items={[{ id: "q1", title: t("faqQ"), content: t("faqA") }]} />
      </Section>

      <ProgressPill
        items={[
          { key: "photo", label: t("checkPhoto"), done: true },
          { key: "headline", label: t("checkHeadline"), done: true },
          { key: "skills", label: t("checkSkills"), done: true },
          { key: "edu", label: t("checkEdu"), done: true },
          { key: "cert", label: t("checkCert"), done: false },
          { key: "post", label: t("checkPost"), done: false },
        ]}
      />
    </div>
  );
}
