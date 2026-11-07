"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Keyboard, Mic, RotateCcw, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, Textarea } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { useAi } from "@/components/ai/ai-provider";
import { errKey } from "@/components/ai/mic-button";
import { transcribe, useRecorder } from "@/components/ai/use-recorder";
import { Waveform, formatClock } from "@/components/ai/waveform";
import { durations, easeSmooth } from "@/lib/motion";
import { draftKeys, hasValue, type DraftKey, type ProfileDraft } from "@/lib/schemas/ai";
import { structureProfile } from "@/server/ai";
import { provinceLabel } from "@/config/th-provinces";

const MAX_MS = 120_000;
type Stage = "intro" | "recording" | "typing" | "working" | "review";

/**
 * "Fill my profile by voice" (section 7.3): speak up to 2 minutes (or type), Claude splits
 * it into fields, and the person reviews each one — accept, edit or skip — before anything
 * is added. Nothing is saved until "Add to my profile".
 */
export function VoiceFillSlot({
  onApply,
}: {
  onApply: (draft: Partial<ProfileDraft>, keys: DraftKey[]) => void;
}) {
  const t = useTranslations("ai.voiceFill");
  const ta = useTranslations("ai");
  const ai = useAi();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState<Stage>("intro");
  const [typed, setTyped] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [draft, setDraft] = React.useState<ProfileDraft | null>(null);
  const [picked, setPicked] = React.useState<Set<DraftKey>>(new Set());
  const [announce, setAnnounce] = React.useState("");
  const available = ai.speech && ai.text;

  const structure = async (text: string) => {
    setStage("working");
    setAnnounce(t("working"));
    setTranscript(text);
    const r = await structureProfile(text, locale).catch(() => ({
      ok: false as const,
      error: "failed" as const,
    }));
    if (!r.ok) {
      toast.error(ta(`errors.${errKey(r.error)}`));
      setStage("intro");
      setAnnounce("");
      return;
    }
    const keys = draftKeys.filter((k) => hasValue(r.data, k));
    if (!keys.length) {
      toast.error(t("nothingFound"));
      setStage("intro");
      return;
    }
    setDraft(r.data);
    setPicked(new Set(keys));
    setStage("review");
    setAnnounce(t("ready", { count: keys.length }));
  };

  const onBlob = async (blob: Blob | null) => {
    if (!blob || blob.size < 1200) {
      toast.error(ta("errors.empty"));
      setStage("intro");
      return;
    }
    setStage("working");
    setAnnounce(ta("transcribing"));
    const r = await transcribe(blob);
    if ("text" in r && r.text) return void structure(r.text);
    toast.error(ta(`errors.${"error" in r ? errKey(r.error) : "empty"}`));
    setStage("intro");
  };
  const rec = useRecorder({ maxMs: MAX_MS, onAutoStop: (b) => void onBlob(b) });

  const startRecording = async () => {
    if (!(await ai.ensureConsent())) return;
    const err = await rec.start();
    if (err) {
      toast.error(ta(`errors.${err}`));
      if (err !== "failed") setStage("typing");
      return;
    }
    setStage("recording");
    setAnnounce(ta("listening"));
  };

  const begin = async (mode: "voice" | "type") => {
    if (!(await ai.ensureConsent())) return;
    setOpen(true);
    setStage(mode === "type" ? "typing" : "intro");
  };

  const close = (o: boolean) => {
    if (o) return setOpen(true);
    rec.cancel();
    setOpen(false);
    setTimeout(() => {
      setStage("intro");
      setDraft(null);
    }, 300);
  };

  const apply = () => {
    if (!draft) return;
    const keys = draftKeys.filter((k) => picked.has(k) && hasValue(draft, k));
    const out: Partial<ProfileDraft> = {};
    for (const k of keys) (out as Record<string, unknown>)[k] = draft[k];
    onApply(out, keys);
    close(false);
    toast.success(t("applied", { count: keys.length }));
  };

  const card = (
    <section
      aria-labelledby="voice-fill-title"
      className="border-line bg-raised flex flex-col gap-4 rounded-[20px] border p-6 sm:flex-row sm:items-center sm:gap-6"
    >
      <span className="bg-brand-soft text-brand flex size-12 shrink-0 items-center justify-center rounded-full">
        <Mic className="size-6 stroke-[1.75]" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="voice-fill-title" className="text-h3">
          {t("title")}
        </h2>
        <p className="text-small text-graphite">{t("body")}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {available ? (
          <>
            <Button type="button" onClick={() => void begin("voice")}>
              <Mic aria-hidden />
              {t("start")}
            </Button>
            <Button type="button" variant="link" className="self-center" onClick={() => void begin("type")}>
              {t("typeInstead")}
            </Button>
          </>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="secondary">
                <Mic aria-hidden />
                {t("start")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="text-small text-graphite">
              <p className="text-ink mb-1 font-medium">{ta("speechUnavailableTitle")}</p>
              {ta("voiceFillUnavailable")}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </section>
  );

  return (
    <>
      {card}
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>
      <Sheet open={open} onOpenChange={close}>
        <SheetContent
          title={stage === "review" ? t("reviewTitle") : t("title")}
          closeLabel={ta("close")}
          className="md:max-w-[640px]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: durations.fast } }}
              transition={{ duration: durations.base, ease: easeSmooth }}
              className="flex flex-col gap-6"
            >
              {stage === "intro" ? (
                <>
                  <div className="flex flex-col gap-3">
                    <p className="text-small text-graphite">{t("introLead")}</p>
                    <ul className="text-small text-ink grid gap-2 sm:grid-cols-2">
                      {(["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"] as const).map((k) => (
                        <li key={k} className="bg-mist rounded-[14px] px-4 py-3">
                          {t(k)}
                        </li>
                      ))}
                    </ul>
                    <p className="text-caption text-graphite">{t("privateNote")}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
                    <Button type="button" size="lg" onClick={() => void startRecording()}>
                      <Mic aria-hidden />
                      {t("record")}
                    </Button>
                    <Button type="button" size="lg" variant="secondary" onClick={() => setStage("typing")}>
                      <Keyboard aria-hidden />
                      {t("typeInstead")}
                    </Button>
                  </div>
                </>
              ) : null}

              {stage === "recording" ? (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="bg-brand-soft flex h-24 w-full items-center justify-center gap-4 rounded-full px-8">
                    <Waveform
                      analyser={rec.analyser}
                      bars={32}
                      className="h-12 min-w-0 flex-1 justify-center overflow-hidden"
                      barClassName="w-1"
                    />
                  </div>
                  <p className="text-h3 tabular-nums" aria-live="off">
                    {formatClock(rec.elapsed)}{" "}
                    <span className="text-graphite font-normal">/ {formatClock(MAX_MS)}</span>
                  </p>
                  <p className="text-small text-graphite text-center">{t("recordingHint")}</p>
                  <div className="flex w-full flex-col gap-3 sm:flex-row-reverse sm:justify-center">
                    <Button type="button" size="lg" onClick={async () => void onBlob(await rec.stop())}>
                      <Square aria-hidden className="!size-4" fill="currentColor" />
                      {t("stop")}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="ghost"
                      onClick={() => {
                        rec.cancel();
                        setStage("intro");
                      }}
                    >
                      {ta("cancel")}
                    </Button>
                  </div>
                </div>
              ) : null}

              {stage === "typing" ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typed.trim().length >= 20) void structure(typed.trim());
                  }}
                >
                  <label htmlFor="vf-typed" className="text-small font-medium">
                    {t("typeLabel")}
                  </label>
                  <Textarea
                    id="vf-typed"
                    rows={7}
                    maxLength={4000}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={t("typePlaceholder")}
                    aria-describedby="vf-typed-hint"
                  />
                  <p id="vf-typed-hint" className="text-caption text-graphite">
                    {t("typeHint")}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
                    <Button type="submit" size="lg" disabled={typed.trim().length < 20}>
                      <Sparkles aria-hidden />
                      {t("draft")}
                    </Button>
                    <Button type="button" size="lg" variant="ghost" onClick={() => setStage("intro")}>
                      {t("back")}
                    </Button>
                  </div>
                </form>
              ) : null}

              {stage === "working" ? (
                <div className="flex flex-col gap-4 py-2" aria-busy>
                  <p className="text-small text-graphite flex items-center gap-2">
                    <Sparkles className="text-brand size-4" aria-hidden />
                    {t("working")}
                  </p>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ))}
                </div>
              ) : null}

              {stage === "review" && draft ? (
                <Review
                  draft={draft}
                  setDraft={setDraft}
                  picked={picked}
                  setPicked={setPicked}
                  transcript={transcript}
                  onApply={apply}
                  onRestart={() => setStage("intro")}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Review({
  draft,
  setDraft,
  picked,
  setPicked,
  transcript,
  onApply,
  onRestart,
}: {
  draft: ProfileDraft;
  setDraft: (d: ProfileDraft) => void;
  picked: Set<DraftKey>;
  setPicked: (s: Set<DraftKey>) => void;
  transcript: string;
  onApply: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("ai.voiceFill");
  const to = useTranslations("onboard");
  const te = useTranslations("enums");
  const ta = useTranslations("ai");
  const locale = useLocale();
  const [heard, setHeard] = React.useState(false);
  const keys = draftKeys.filter((k) => hasValue(draft, k));
  const count = keys.filter((k) => picked.has(k)).length;

  const toggle = (k: DraftKey, on: boolean) => {
    const s = new Set(picked);
    if (on) s.add(k);
    else s.delete(k);
    setPicked(s);
  };
  const setStr = (k: DraftKey, v: string) => setDraft({ ...draft, [k]: v });
  const setList = (k: "skills" | "languages", v: string) =>
    setDraft({
      ...draft,
      [k]: v
        .split(/[,،、]/)
        .map((x) => x.trim())
        .filter(Boolean),
    });

  const labels: Record<DraftKey, string> = {
    firstName: to("firstName"),
    lastName: to("lastName"),
    displayName: to("displayName"),
    headline: to("headline"),
    bio: to("bio"),
    province: to("province"),
    languages: to("languages"),
    workMode: to("workMode"),
    availability: to("availability"),
    skills: to("skills"),
    specialTalents: to("specialTalents"),
    educations: to("education"),
  };

  const editor = (k: DraftKey) => {
    const id = `vf-${k}`;
    switch (k) {
      case "bio":
      case "specialTalents":
        return (
          <Textarea id={id} rows={4} value={draft[k] ?? ""} onChange={(e) => setStr(k, e.target.value)} />
        );
      case "skills":
      case "languages":
        return (
          <Input
            id={id}
            value={draft[k].join(", ")}
            onChange={(e) => setList(k, e.target.value)}
            aria-describedby={`${id}-hint`}
          />
        );
      case "workMode":
        return (
          <p className="text-small text-ink">{draft.workMode ? te(`workMode.${draft.workMode}`) : ""}</p>
        );
      case "availability":
        return (
          <p className="text-small text-ink">
            {draft.availability.map((a) => te(`availability.${a}`)).join(", ")}
          </p>
        );
      case "province":
        return <p className="text-small text-ink">{provinceLabel(draft.province, locale)}</p>;
      case "educations":
        return (
          <ul className="text-small text-ink flex flex-col gap-1">
            {draft.educations.map((e, i) => (
              <li key={i}>
                {te(`education.${e.level}`)} · {e.school}
                {e.field ? `, ${e.field}` : ""}
                {e.yearEnd ? ` (${e.yearEnd})` : ""}
              </li>
            ))}
          </ul>
        );
      default:
        return (
          <Input
            id={id}
            value={(draft[k] as string | null) ?? ""}
            onChange={(e) => setStr(k, e.target.value)}
          />
        );
    }
  };
  const editable = (k: DraftKey) => !["workMode", "availability", "province", "educations"].includes(k);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-small text-graphite flex flex-wrap items-center gap-x-2">
        <span className="text-caption text-brand inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="size-3.5" aria-hidden />
          {ta("suggestion")}
        </span>
        {t("reviewLead")}
      </p>
      <ul className="flex flex-col gap-3">
        {keys.map((k) => (
          <li
            key={k}
            className={`border-line rounded-[16px] border p-4 transition-opacity duration-200 ${picked.has(k) ? "" : "opacity-60"}`}
          >
            <div className="mb-3 flex items-center gap-3">
              <Checkbox
                id={`vf-pick-${k}`}
                checked={picked.has(k)}
                onCheckedChange={(v) => toggle(k, v === true)}
                aria-label={t("include", { field: labels[k] })}
              />
              {editable(k) ? (
                <label htmlFor={`vf-${k}`} className="text-small font-medium">
                  {labels[k]}
                </label>
              ) : (
                <span className="text-small font-medium">{labels[k]}</span>
              )}
            </div>
            {editor(k)}
            {k === "skills" || k === "languages" ? (
              <p id={`vf-${k}-hint`} className="text-caption text-graphite mt-2">
                {t("commaHint")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <div>
        <button
          type="button"
          aria-expanded={heard}
          onClick={() => setHeard((h) => !h)}
          className="text-small text-graphite hover:text-ink inline-flex min-h-11 items-center gap-1.5"
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${heard ? "rotate-180" : ""}`}
            aria-hidden
          />
          {t("whatWeHeard")}
        </button>
        {heard ? (
          <p className="text-small text-graphite bg-mist mt-2 rounded-[14px] p-4 whitespace-pre-line">
            {transcript}
          </p>
        ) : null}
      </div>
      <div className="bg-paper sticky bottom-0 -mx-1 flex flex-col gap-3 px-1 pt-2 pb-1 sm:flex-row-reverse sm:justify-start">
        <Button type="button" size="lg" disabled={!count} onClick={onApply}>
          {t("apply", { count })}
        </Button>
        <Button type="button" size="lg" variant="ghost" onClick={onRestart}>
          <RotateCcw aria-hidden />
          {t("restart")}
        </Button>
      </div>
    </div>
  );
}
