"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pill choices backed by real radio/checkbox inputs (keyboard + screen-reader native). */
export function ToggleChips<T extends string>({
  legend,
  options,
  value,
  onChange,
  multiple,
  label,
  name,
}: {
  legend: string;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  multiple: boolean;
  label: (v: T) => string;
  name?: string;
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
                on ? "border-brand bg-brand-soft text-brand font-medium" : "border-field-line hover:bg-mist",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                className="sr-only"
                checked={on}
                name={name ?? legend}
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
