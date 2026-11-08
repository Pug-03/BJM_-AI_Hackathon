"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky header that condenses into a centred floating pill once the page scrolls
 * (owner request). At the top it is a full-width bar; reduced motion skips the transition.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn("sticky top-0 z-40", scrolled && "pointer-events-none")}
    >
      {/* Full-width bar background: fades out as the pill takes over (opacity only). */}
      <div
        aria-hidden
        className={cn(
          "border-line bg-paper/90 absolute inset-0 border-b backdrop-blur-md transition-opacity duration-300",
          scrolled ? "opacity-0" : "opacity-100",
        )}
      />
      <div
        className={cn(
          "ease-smooth relative transition-[padding] duration-500",
          scrolled ? "px-3 pt-2 md:px-6" : "px-0 pt-0",
        )}
      >
        <div
          className={cn(
            "ease-smooth mx-auto flex items-center gap-4 border transition-[max-width,height,padding,border-radius,background-color,border-color,box-shadow] duration-500",
            scrolled
              ? "border-line bg-paper/85 shadow-float h-14 max-w-[1080px] rounded-full pr-2 pl-4 backdrop-blur-md md:pl-5"
              : "h-16 max-w-[1200px] rounded-none border-transparent px-4 md:px-8",
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
