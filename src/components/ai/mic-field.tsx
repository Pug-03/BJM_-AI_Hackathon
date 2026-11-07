"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { durations, easeSmooth } from "@/lib/motion";
import type { BioContext } from "@/lib/ai/prompts";
import { draftBio } from "@/server/ai";
import { useAi } from "./ai-provider";
import { AiNote } from "./ai-note";
import { MicButton, errKey } from "./mic-button";

interface MicProps {
  value: string;
  onValueChange: (v: string) => void;
  /** Visible field label (for the mic's accessible name and announcements). */
  label: string;
  /** "append" adds dictation after existing text; "replace" swaps it (default for inputs). */
  mode?: "replace" | "append";
  /** Marked by "Fill my profile by voice" — shows the AI label until kept or edited. */
  aiSuggested?: boolean;
  onSuggestionResolved?: () => void;
}

const fit = (v: string, max?: number) => (max && max > 0 ? v.slice(0, max) : v);

function useSuggestion(p: MicProps, maxLength?: number) {
  const [prev, setPrev] = React.useState<string | null>(null);
  const shown = prev !== null || Boolean(p.aiSuggested);
  const resolve = () => {
    setPrev(null);
    p.onSuggestionResolved?.();
  };
  return {
    shown,
    fill: (text: string, mode: "replace" | "append") => {
      const next = mode === "append" && p.value.trim() ? `${p.value.trimEnd()} ${text}` : text;
      setPrev(p.value);
      p.onValueChange(fit(next, maxLength));
    },
    edit: (v: string) => {
      p.onValueChange(v);
      if (shown) resolve();
    },
    note: shown ? (
      <AiNote
        onKeep={resolve}
        onUndo={
          prev !== null
            ? () => {
                p.onValueChange(prev);
                resolve();
              }
            : undefined
        }
      />
    ) : null,
  };
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & MicProps;

/** Input with the "Speak to fill" mic. */
export const MicInput = React.forwardRef<HTMLInputElement, InputProps>(function MicInput(
  { value, onValueChange, label, mode = "replace", aiSuggested, onSuggestionResolved, className, ...rest },
  ref,
) {
  const s = useSuggestion({ value, onValueChange, label, aiSuggested, onSuggestionResolved }, rest.maxLength);
  return (
    <>
      <div className="relative">
        <Input
          ref={ref}
          {...rest}
          value={value}
          onChange={(e) => s.edit(e.target.value)}
          className={cn("pr-14", className)}
        />
        <MicButton kind="input" label={label} onText={(t) => s.fill(t, mode)} disabled={rest.disabled} />
      </div>
      {s.note}
    </>
  );
});

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> &
  MicProps & {
    /** Adds "Write with AI" under the field, drafting from this context. */
    writeWithAi?: () => BioContext;
  };

/** Textarea with the mic (appends by default) and optional "Write with AI". */
export const MicTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function MicTextarea(
  {
    value,
    onValueChange,
    label,
    mode = "append",
    aiSuggested,
    onSuggestionResolved,
    writeWithAi,
    className,
    ...rest
  },
  ref,
) {
  const s = useSuggestion({ value, onValueChange, label, aiSuggested, onSuggestionResolved }, rest.maxLength);
  return (
    <>
      <div className="relative">
        <Textarea
          ref={ref}
          {...rest}
          value={value}
          onChange={(e) => s.edit(e.target.value)}
          className={cn("pr-14", className)}
        />
        <MicButton
          kind="textarea"
          label={label}
          onText={(t) => s.fill(t, mode)}
          maxMs={120_000}
          disabled={rest.disabled}
        />
      </div>
      {s.note}
      {writeWithAi ? (
        <WriteWithAi
          getContext={writeWithAi}
          onUse={(text) => s.fill(text, "replace")}
          maxLength={rest.maxLength}
        />
      ) : null}
    </>
  );
});

/** "Write with AI" (section 7.3): drafts from what the person entered; shown as a suggestion to use, retry or dismiss. */
function WriteWithAi({
  getContext,
  onUse,
  maxLength,
}: {
  getContext: () => BioContext;
  onUse: (text: string) => void;
  maxLength?: number;
}) {
  const t = useTranslations("ai");
  const locale = useLocale();
  const ai = useAi();
  const [busy, setBusy] = React.useState(false);
  const [draft, setDraft] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const run = async () => {
    if (!(await ai.ensureConsent())) return;
    setBusy(true);
    const r = await draftBio(getContext(), locale).catch(() => ({
      ok: false as const,
      error: "failed" as const,
    }));
    setBusy(false);
    if (r.ok) {
      setDraft(fit(r.data.bio, maxLength));
      requestAnimationFrame(() => panelRef.current?.focus());
    } else toast.error(t(r.error === "empty" ? "errors.needFacts" : `errors.${errKey(r.error)}`));
  };

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-brand -ml-2 self-start"
      loading={busy}
      onClick={ai.text ? () => void run() : undefined}
    >
      <Sparkles aria-hidden />
      {draft ? t("tryAgain") : t("writeWithAi")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {ai.text ? (
        trigger
      ) : (
        <Popover>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="text-small text-graphite">
            <p className="text-ink mb-1 font-medium">{t("textUnavailableTitle")}</p>
            {t("textUnavailable")}
          </PopoverContent>
        </Popover>
      )}
      <AnimatePresence initial={false}>
        {draft ? (
          <motion.div
            key="draft"
            ref={panelRef}
            tabIndex={-1}
            role="region"
            aria-label={t("suggestion")}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: durations.fast } }}
            transition={{ duration: durations.base, ease: easeSmooth }}
            className="border-line bg-mist flex flex-col gap-3 rounded-[16px] border p-4 focus:outline-none"
          >
            <p className="text-caption text-brand flex items-center gap-1.5 font-medium">
              <Sparkles className="size-3.5" aria-hidden />
              {t("suggestion")}
            </p>
            <p className="text-small text-ink whitespace-pre-line">{draft}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onUse(draft);
                  setDraft(null);
                }}
              >
                {t("useThis")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
                {t("dismiss")}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
