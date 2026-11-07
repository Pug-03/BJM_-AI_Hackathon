"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Mic, Square } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { durations, easeSmooth } from "@/lib/motion";
import { useAi } from "./ai-provider";
import { transcribe, useRecorder } from "./use-recorder";
import { Waveform, formatClock } from "./waveform";

const btn =
  "absolute z-10 flex size-11 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 ease-smooth active:scale-95 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:size-5 [&_svg]:stroke-[1.75]";

/**
 * The "Speak to fill" mic (section 1): tap, speak Thai or English, the field fills.
 * The listening capsule grows out of the button over the field; states are announced
 * in a polite live region. Never a dead button: without keys it explains why.
 */
export function MicButton({
  kind,
  label,
  onText,
  maxMs = 60_000,
  disabled,
}: {
  kind: "input" | "textarea";
  /** Field name, used in "Speak to fill {label}" and "Filled {label}". */
  label: string;
  onText: (text: string) => void;
  maxMs?: number;
  disabled?: boolean;
}) {
  const t = useTranslations("ai");
  const ai = useAi();
  const [phase, setPhase] = React.useState<"idle" | "listening" | "working">("idle");
  const [announce, setAnnounce] = React.useState("");
  const pos = kind === "input" ? "top-0.5 right-0.5" : "right-1.5 bottom-1.5";

  const handleBlob = React.useCallback(
    async (blob: Blob | null) => {
      if (!blob || blob.size < 1200) {
        setPhase("idle");
        setAnnounce("");
        toast.error(t("errors.empty"));
        return;
      }
      setPhase("working");
      setAnnounce(t("transcribing"));
      const r = await transcribe(blob);
      setPhase("idle");
      if ("text" in r && r.text) {
        onText(r.text);
        setAnnounce(t("filled", { field: label }));
      } else {
        setAnnounce("");
        toast.error(t(`errors.${"error" in r ? errKey(r.error) : "empty"}`));
      }
    },
    [label, onText, t],
  );

  const rec = useRecorder({ maxMs, onAutoStop: (b) => void handleBlob(b) });

  const onClick = async () => {
    if (phase === "listening") return void handleBlob(await rec.stop());
    if (phase !== "idle") return;
    if (!(await ai.ensureConsent())) return;
    const err = await rec.start();
    if (err) return void toast.error(t(`errors.${err}`));
    setPhase("listening");
    setAnnounce(t("listening"));
  };

  const live = (
    <span aria-live="polite" className="sr-only">
      {announce}
    </span>
  );

  if (!ai.speech) {
    return (
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("speakTo", { field: label })}
              className={cn(btn, pos, "text-graphite hover:bg-mist hover:text-ink")}
            >
              <Mic aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="text-small text-graphite">
            <p className="text-ink mb-1 font-medium">{t("speechUnavailableTitle")}</p>
            {t("speechUnavailable")}
          </PopoverContent>
        </Popover>
        {live}
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {phase === "listening" ? (
          <motion.div
            key="capsule"
            className={cn(
              "pointer-events-none absolute z-[5] flex items-center",
              kind === "input" ? "inset-0.5" : "right-1.5 bottom-1.5 left-1.5 h-11",
            )}
            exit={{ opacity: 0, transition: { duration: durations.fast } }}
          >
            <motion.span
              className="bg-brand-soft absolute inset-0 origin-right rounded-full"
              initial={{ scaleX: 0.1 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: durations.slow, ease: easeSmooth }}
            />
            <motion.span
              className="relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden pr-14 pl-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: durations.fast, delay: 0.08 }}
            >
              <span className="text-caption text-brand shrink-0 font-medium">{t("listeningShort")}</span>
              <Waveform
                analyser={rec.analyser}
                bars={16}
                className="min-w-0 flex-1 justify-center overflow-hidden"
              />
              <span className="text-caption text-brand shrink-0 tabular-nums">
                {formatClock(rec.elapsed)}
              </span>
            </motion.span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        type="button"
        disabled={disabled || phase === "working"}
        aria-label={
          phase === "listening"
            ? t("stopFor", { field: label })
            : phase === "working"
              ? t("transcribing")
              : t("speakTo", { field: label })
        }
        aria-pressed={phase === "listening"}
        aria-busy={phase === "working" || undefined}
        onClick={() => void onClick()}
        onKeyDown={(e) => {
          if (e.key === "Escape" && phase === "listening") {
            e.preventDefault();
            rec.cancel();
            setPhase("idle");
            setAnnounce(t("cancelled"));
          }
        }}
        className={cn(
          btn,
          pos,
          phase === "listening" ? "bg-brand text-white" : "text-graphite hover:bg-mist hover:text-ink",
          "disabled:opacity-60",
        )}
      >
        {phase === "listening" ? (
          <Square aria-hidden className="!size-4" fill="currentColor" />
        ) : phase === "working" ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Mic aria-hidden />
        )}
      </button>
      {live}
    </>
  );
}

const KNOWN = new Set([
  "denied",
  "unsupported",
  "failed",
  "consent",
  "rate_limited",
  "unavailable",
  "network",
  "too_large",
  "empty",
]);
export function errKey(e: string) {
  return KNOWN.has(e) ? e : "failed";
}
