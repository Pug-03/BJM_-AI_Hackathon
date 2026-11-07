"use client";

import * as React from "react";
import { Avatar as A } from "radix-ui";
import { cn, initials } from "@/lib/utils";

const sizes = {
  xs: "size-8 text-caption",
  sm: "size-10 text-small",
  md: "size-12 text-body",
  lg: "size-20 text-h3",
  xl: "size-32 text-h2 md:size-36",
} as const;

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  className?: string;
  /** Avatar images are decorative next to a visible name; pass alt when no name is shown. */
  alt?: string;
}

export function Avatar({ src, name, size = "md", className, alt = "" }: AvatarProps) {
  return (
    <A.Root
      className={cn(
        "bg-cloud relative inline-flex shrink-0 overflow-hidden rounded-full",
        sizes[size],
        className,
      )}
    >
      {src ? <A.Image src={src} alt={alt} className="size-full object-cover" /> : null}
      <A.Fallback
        delayMs={src ? 300 : 0}
        // Initials are drawn with CSS content so they never leak into a parent control's
        // accessible name (e.g. an "Account menu" button). Neutral, not violet (§4.2).
        className="bg-avatar text-graphite flex size-full items-center justify-center font-semibold before:content-[attr(data-initials)]"
        data-initials={initials(name)}
        aria-hidden
      />
    </A.Root>
  );
}
