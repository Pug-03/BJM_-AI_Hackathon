"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Mic } from "lucide-react";
import { durations, easeSmooth, useReducedMotion } from "@/lib/motion";

/**
 * Section 6.4 — a pre-recorded, clearly labelled demo of "Fill my profile by voice":
 * a spoken sentence becomes three filled fields. Loops while on screen; static when
 * reduced motion is on. No AI call is made here.
 */
export function SpeakDemo() {
  const t = useTranslations("home.speak");
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [phase, setPhase] = React.useState(0); // 0 idle, 1 listening, 2–4 fields filled
  React.useEffect(() => {
    if (reduced) return setPhase(4);
    if (!inView) return;
    const seq = [600, 2600, 600, 600, 3600];
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const step = () => {
      i = (i + 1) % 5;
      setPhase(i);
      id = setTimeout(step, seq[i]);
    };
    setPhase(0);
    id = setTimeout(step, seq[0]);
    return () => clearTimeout(id);
  }, [inView, reduced]);

  const fields = [
    { label: t("f1"), value: t("v1") },
    { label: t("f2"), value: t("v2") },
    { label: t("f3"), value: t("v3") },
  ];
  return (
    <div
      ref={ref}
      className="border-line bg-raised shadow-float relative flex flex-col gap-4 rounded-[20px] border p-6"
      aria-hidden
    >
      <span className="border-line bg-paper text-caption text-graphite absolute -top-3 right-4 rounded-full border px-3 py-1">
        {t("demo")}
      </span>
      <div className="relative flex h-14 items-center">
        <div className="border-field-line bg-paper text-small text-graphite flex h-14 w-full items-center rounded-full border pr-16 pl-5">
          <span className="truncate italic">“{t("quote")}”</span>
        </div>
        <AnimatePresence>
          {phase === 1 ? (
            <motion.div
              className="absolute inset-0 flex items-center"
              exit={{ opacity: 0, transition: { duration: durations.fast } }}
            >
              <motion.span
                className="bg-brand-soft absolute inset-0 rounded-full"
                // Grows out of the mic as a pill (clip-path keeps the round end caps; no squash).
                initial={{ clipPath: "inset(0 0 0 calc(100% - 48px) round 999px)" }}
                animate={{ clipPath: "inset(0 0 0 0px round 999px)" }}
                transition={{ duration: durations.slow, ease: easeSmooth }}
              />
              <span className="relative flex flex-1 items-center gap-[3px] overflow-hidden pr-16 pl-5">
                <span className="text-caption text-brand mr-2 font-medium">{t("listening")}</span>
                {Array.from({ length: 22 }, (_, i) => (
                  <motion.span
                    key={i}
                    className="bg-brand block h-5 w-[3px] shrink-0 rounded-full"
                    animate={{
                      scaleY: [0.25, 0.5 + ((i * 37) % 50) / 100, 0.3, 0.95 - ((i * 23) % 45) / 100, 0.25],
                    }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.03, ease: "easeInOut" }}
                  />
                ))}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <span
          className={`absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 ${phase === 1 ? "bg-brand text-white" : "bg-mist text-ink"}`}
        >
          <Mic className="size-5 stroke-[1.75]" />
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {fields.map((f, i) => (
          <li key={f.label} className="border-line rounded-[14px] border px-4 py-3">
            <p className="text-caption text-graphite mb-1">{f.label}</p>
            <motion.p
              className="text-small text-ink min-h-5"
              initial={false}
              animate={{ opacity: phase >= i + 2 ? 1 : 0, y: phase >= i + 2 ? 0 : 4 }}
              transition={{ duration: durations.base, ease: easeSmooth }}
            >
              {f.value}
            </motion.p>
          </li>
        ))}
      </ul>
    </div>
  );
}
