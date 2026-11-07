"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronUp, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring, useReducedMotion } from "@/lib/motion";

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href?: string;
  onClick?: () => void;
}

/** Floating "Finish your profile 4/6" pill that expands into a checklist. */
export function ProgressPill({ items, className }: { items: ChecklistItem[]; className?: string }) {
  const t = useTranslations("progress");
  const [open, setOpen] = React.useState(false);
  const reduced = useReducedMotion();
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  if (done === total) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      className={cn(
        "fixed right-4 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+28px)] z-30 md:right-6 md:bottom-6",
        className,
      )}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            id="progress-checklist"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={spring}
            className="border-line bg-paper shadow-float mb-3 w-[min(320px,calc(100vw-32px))] origin-bottom-right rounded-[20px] border p-4"
          >
            <p className="text-small mb-1 font-semibold">{t("title")}</p>
            <div className="bg-mist mb-3 h-1.5 overflow-hidden rounded-full" aria-hidden>
              <div
                className="bg-brand h-full origin-left rounded-full"
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            </div>
            <ul className="flex flex-col">
              {items.map((it) => {
                const inner = (
                  <>
                    {it.done ? (
                      <Check className="text-success size-5" aria-hidden />
                    ) : (
                      <Circle className="text-graphite size-5" aria-hidden />
                    )}
                    <span className={cn(it.done && "text-graphite line-through")}>{it.label}</span>
                  </>
                );
                const cls =
                  "flex min-h-11 w-full items-center gap-3 rounded-[14px] px-2 text-left text-small hover:bg-mist";
                return (
                  <li key={it.key}>
                    {it.href ? (
                      <a href={it.href} className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <button type="button" className={cls} onClick={it.onClick}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={spring}
        aria-expanded={open}
        aria-controls="progress-checklist"
        onClick={() => setOpen((o) => !o)}
        className="bg-ink text-small text-paper shadow-float ml-auto flex h-12 items-center gap-3 rounded-full pr-4 pl-2 font-medium"
      >
        <span className="relative flex size-8 items-center justify-center" aria-hidden>
          <svg viewBox="0 0 36 36" className="size-8 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeOpacity=".25"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
            />
          </svg>
        </span>
        {t("pill", { done, total })}
        <ChevronUp
          className={cn("size-4 transition-transform duration-200", !open && "rotate-180")}
          aria-hidden
        />
      </motion.button>
    </div>
  );
}
