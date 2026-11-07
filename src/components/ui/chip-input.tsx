"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { inputBase } from "./input";

export interface ChipInputProps {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  addLabel: string;
  removeLabel: (chip: string) => string;
  suggestionsLabel?: string;
  max?: number;
  "aria-describedby"?: string;
  /** Optional slot rendered at the end of the input row (e.g. mic button). */
  endSlot?: React.ReactNode;
}

/** Skills chip input — Enter or comma adds, Backspace on empty removes the last chip. */
export function ChipInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder,
  addLabel,
  removeLabel,
  suggestionsLabel,
  max = 30,
  endSlot,
  ...rest
}: ChipInputProps) {
  const [draft, setDraft] = React.useState("");
  const lower = value.map((v) => v.toLowerCase());

  const add = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.map((v) => v.toLowerCase()).includes(p.toLowerCase())) next.push(p.slice(0, 60));
    }
    onChange(next);
    setDraft("");
  };

  const filtered = suggestions
    .filter((s) => !lower.includes(s.toLowerCase()))
    .filter((s) => !draft || s.toLowerCase().includes(draft.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      {value.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={addLabel}>
          <AnimatePresence initial={false}>
            {value.map((chip) => (
              <motion.li
                key={chip}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="flex h-9 items-center gap-1 rounded-full bg-brand-soft pr-1 pl-3.5 text-small font-medium text-ink"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== chip))}
                  aria-label={removeLabel(chip)}
                  className="relative flex size-7 items-center justify-center rounded-full text-graphite hover:bg-paper hover:text-ink before:absolute before:-inset-1.5"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
      <div className="relative">
        <input
          id={id}
          value={draft}
          placeholder={placeholder}
          aria-describedby={rest["aria-describedby"]}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          className={cn(inputBase, "h-12", endSlot ? "pr-24" : "pr-14")}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {endSlot}
          <button
            type="button"
            onClick={() => add(draft)}
            disabled={!draft.trim()}
            aria-label={addLabel}
            className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-cloud disabled:opacity-40"
          >
            <Plus className="size-5 stroke-[1.75]" aria-hidden />
          </button>
        </div>
      </div>
      {filtered.length ? (
        <div className="flex flex-col gap-2">
          {suggestionsLabel ? <p className="text-caption text-graphite">{suggestionsLabel}</p> : null}
          <ul className="flex flex-wrap gap-2">
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => add(s)}
                  className="flex h-11 items-center gap-1.5 rounded-full border border-line px-3.5 text-small text-ink hover:bg-mist md:h-9"
                >
                  <Plus className="size-4 text-graphite" aria-hidden />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
