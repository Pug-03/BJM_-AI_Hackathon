"use client";

import { useReducedMotion as useMotionReducedMotion, type Transition, type Variants } from "motion/react";

/**
 * ABLE motion system — section 5.
 * Only transform and opacity are animated. Every pattern has a reduced-motion
 * variant that replaces movement with a plain opacity fade.
 */

export const easeSmooth = [0.22, 1, 0.36, 1] as const;
export const spring: Transition = { type: "spring", stiffness: 380, damping: 32 };
export const durations = { fast: 0.16, base: 0.22, slow: 0.32 } as const;

const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.fast } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

/** One global hook for reduced motion. */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeSmooth } },
  exit: { opacity: 0, transition: { duration: durations.fast, ease: easeSmooth } },
};

/** Tab content slides in the direction of the selected tab. `custom` = direction (1 or -1). */
export const tabSlide: Variants = {
  initial: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  animate: { opacity: 1, x: 0, transition: { duration: durations.base, ease: easeSmooth } },
  exit: (dir: number) => ({
    opacity: 0,
    x: -24 * dir,
    transition: { duration: durations.fast, ease: easeSmooth },
  }),
};

export const dropIn: Variants = {
  initial: { opacity: 0, y: -12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: durations.base, ease: easeSmooth } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: durations.fast, ease: easeSmooth } },
};

export const sheetUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: { ...spring } },
  exit: { y: "100%", transition: { duration: durations.base, ease: easeSmooth } },
};

export const zoomIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: durations.slow, ease: easeSmooth } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: durations.base, ease: easeSmooth } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeSmooth } },
};

export const pressable = {
  whileTap: { scale: 0.97 },
  transition: spring,
} as const;

/** Swipe thresholds for the mobile feed card. */
export const swipe = {
  threshold: 110,
  velocity: 600,
  maxRotate: 8,
} as const;

/** Picks the reduced-motion fade when the user asks for less movement. */
export function variantsFor(variants: Variants, reduced: boolean): Variants {
  return reduced ? fade : variants;
}
