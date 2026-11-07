"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  digitLabel: (n: number) => string;
  groupLabel: string;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  /** Increment to move focus back to the first box (e.g. after a wrong code). */
  focusSignal?: number;
}

/** Six boxes: auto-advance, backspace to previous, arrow keys, paste a full code. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  digitLabel,
  groupLabel,
  invalid,
  disabled,
  describedBy,
  focusSignal,
}: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
    return clean;
  };

  React.useEffect(() => {
    refs.current[0]?.focus();
  }, [focusSignal]);

  return (
    <div
      role="group"
      aria-label={groupLabel}
      aria-describedby={describedBy}
      className="flex justify-between gap-2 sm:gap-3"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? 6 : 1}
          aria-label={digitLabel(i + 1)}
          aria-invalid={invalid || undefined}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw.length > 1) {
              // iOS one-time-code autofill or typing over: treat as paste from this index.
              const clean = set((value.slice(0, i) + raw).slice(0, 6));
              refs.current[Math.min(clean.length, 5)]?.focus();
              return;
            }
            const arr = digits.slice();
            arr[i] = raw;
            const joined = arr.join("").slice(0, 6);
            set(arr.join("").length === joined.length ? joined : joined);
            if (raw && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              e.preventDefault();
              const arr = digits.slice();
              arr[i - 1] = "";
              set(arr.join(""));
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft" && i > 0) {
              e.preventDefault();
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < 5) {
              e.preventDefault();
              refs.current[i + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const clean = set(e.clipboardData.getData("text"));
            refs.current[Math.min(clean.length, 5)]?.focus();
          }}
          className={cn(
            "bg-paper text-h3 text-ink border-field-line h-14 w-full max-w-14 min-w-0 rounded-[14px] border text-center font-semibold tabular-nums",
            "focus:border-brand focus:bg-paper focus-visible:outline-brand transition-[border-color,background-color] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid",
            invalid && "border-danger",
          )}
        />
      ))}
    </div>
  );
}
