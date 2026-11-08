"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/**
 * In-page section link ("How it works", "FAQ"…). On the landing page it glides to the
 * section (smooth scroll, offset for the sticky header) and moves keyboard focus there;
 * from other pages it navigates to the landing page and lands on the section.
 * Reduced motion: jumps without animation.
 */
export const AnchorLink = React.forwardRef<
  HTMLAnchorElement,
  { hash: string; children: React.ReactNode; className?: string; onNavigate?: () => void; delay?: number }
>(function AnchorLink({ hash, children, className, onNavigate, delay = 0 }, ref) {
  const locale = useLocale();
  const pathname = usePathname();
  const href = `/${locale}#${hash}`;
  return (
    <a
      ref={ref}
      href={href}
      className={className}
      onClick={(e) => {
        onNavigate?.();
        if (pathname !== "/") return; // full navigation to the landing page
        const el = document.getElementById(hash);
        if (!el) return;
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.history.replaceState(null, "", href);
        // `delay` lets a closing menu return focus first, so it doesn't pull the page back up.
        window.setTimeout(() => {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
          // Move focus for keyboard/screen-reader users once the scroll settles.
          window.setTimeout(
            () => {
              el.setAttribute("tabindex", "-1");
              el.focus({ preventScroll: true });
            },
            reduced ? 0 : 700,
          );
        }, delay);
      }}
    >
      {children}
    </a>
  );
});
