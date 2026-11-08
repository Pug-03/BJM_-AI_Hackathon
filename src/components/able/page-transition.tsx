"use client";

import * as React from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { pageTransition, useReducedMotion, variantsFor } from "@/lib/motion";

/**
 * Route-change fade + 8px rise, keyed by pathname. The first page load is not animated (LCP),
 * and there is no exit phase: an exiting copy would render the new route's children twice
 * (duplicate headings for screen readers).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const first = React.useRef(pathname);
  return (
    <motion.div
      key={pathname}
      variants={variantsFor(pageTransition, reduced)}
      initial={pathname === first.current ? false : "initial"}
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
