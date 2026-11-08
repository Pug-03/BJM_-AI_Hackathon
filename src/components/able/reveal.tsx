"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { easeSmooth, useReducedMotion } from "@/lib/motion";

type Dir = "up" | "left" | "right" | "scale";
const from: Record<Dir, Record<string, number>> = {
  up: { opacity: 0, y: 28 },
  left: { opacity: 0, x: -32 },
  right: { opacity: 0, x: 32 },
  scale: { opacity: 0, scale: 0.96, y: 16 },
};

/**
 * Scroll reveal (section 5): content rises into place once as it enters the viewport.
 * Transform + opacity only (no layout shift); reduced motion shows it immediately.
 */
export function Reveal({
  children,
  delay = 0,
  dir = "up",
  className,
  ...rest
}: { children: React.ReactNode; delay?: number; dir?: Dir; className?: string } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : from[dir]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: easeSmooth, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A list whose items reveal one after another. */
export function RevealList({
  children,
  className,
  as = "ul",
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "ul" | "ol" | "div";
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduced ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Comp>
  );
}

export function RevealItem({
  children,
  className,
  as = "li",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "li" | "div";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeSmooth } },
      }}
    >
      {children}
    </Comp>
  );
}
