"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Display-only stars with a text alternative. */
export function RatingStars({
  value,
  size = 16,
  label,
  className,
}: {
  value: number;
  size?: number;
  /** Accessible text, e.g. "Rated 4.8 out of 5". */
  label: string;
  className?: string;
}) {
  return (
    <span role="img" aria-label={label} className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
            <Star
              className="text-line absolute inset-0"
              style={{ width: size, height: size }}
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                className="text-star"
                style={{ width: size, height: size }}
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Star input as a radio group (keyboard: arrows). */
export function RatingInput({
  value,
  onChange,
  legend,
  starLabel,
  name = "rating",
}: {
  value: number;
  onChange: (v: number) => void;
  legend: string;
  starLabel: (n: number) => string;
  name?: string;
}) {
  const [hover, setHover] = React.useState(0);
  const shown = hover || value;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-small mb-2 font-medium">{legend}</legend>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="has-[:focus-visible]:outline-brand relative flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={starLabel(n)}
            />
            <Star
              className={cn(
                "size-8 transition-transform duration-150",
                n <= shown ? "text-star" : "text-line",
                n === hover && "scale-110",
              )}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
