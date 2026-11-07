"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Live waveform bars driven by an AnalyserNode. Bars animate with transform only and are
 * written directly to the DOM each frame (no React re-render). Decorative: aria-hidden.
 */
export function Waveform({
  analyser,
  bars = 20,
  className,
  barClassName,
}: {
  analyser: AnalyserNode | null;
  bars?: number;
  className?: string;
  barClassName?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.children) as HTMLElement[];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!analyser || reduced) {
      spans.forEach((s) => (s.style.transform = "scaleY(0.35)"));
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      spans.forEach((s, i) => {
        // Mirror around the centre so speech looks balanced.
        const mid = (bars - 1) / 2;
        const bin = Math.min(data.length - 1, Math.round((Math.abs(i - mid) / mid) * (data.length * 0.6)));
        const v = (data[bin] ?? 0) / 255;
        s.style.transform = `scaleY(${Math.max(0.15, Math.min(1, v * 1.4))})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser, bars]);
  return (
    <span ref={ref} aria-hidden className={cn("flex h-5 items-center gap-[3px]", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn(
            "bg-brand block h-full w-[3px] shrink-0 origin-center rounded-full transition-transform duration-75",
            barClassName,
          )}
          style={{ transform: "scaleY(0.15)" }}
        />
      ))}
    </span>
  );
}

export function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
