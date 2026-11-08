"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useReducedMotion } from "@/lib/motion";

export interface LightboxImage {
  src: string;
  alt: string;
}

/**
 * Zoom-in lightbox (section 5 `zoomIn`): the image grows from its thumbnail via a
 * shared `layoutId`, and shrinks back on close. Arrow keys move between images.
 */
export function useLightbox() {
  const [state, setState] = React.useState<{ images: LightboxImage[]; index: number; group: string } | null>(
    null,
  );
  return {
    state,
    open: (images: LightboxImage[], index: number, group: string) => setState({ images, index, group }),
    close: () => setState(null),
    set: (index: number) => setState((s) => (s ? { ...s, index } : s)),
  };
}

export function Thumb({
  src,
  alt,
  layoutId,
  onOpen,
  label,
  className,
}: {
  src: string;
  alt: string;
  layoutId: string;
  onOpen: () => void;
  label: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <button type="button" onClick={onOpen} aria-label={label} className={className}>
      <motion.img
        layoutId={reduced ? undefined : layoutId}
        src={src}
        alt={alt}
        className="size-full rounded-[16px] object-cover dark:brightness-90"
        loading="lazy"
      />
    </button>
  );
}

export function Lightbox({
  lb,
  closeLabel,
  prevLabel,
  nextLabel,
}: {
  lb: ReturnType<typeof useLightbox>;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const reduced = useReducedMotion();
  const s = lb.state;
  const img = s?.images[s.index];
  return (
    <D.Root open={Boolean(s)} onOpenChange={(o) => !o && lb.close()}>
      <AnimatePresence>
        {s && img ? (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[rgba(15,14,18,0.88)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </D.Overlay>
            <D.Content
              forceMount
              className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none md:p-12"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" && s.index < s.images.length - 1) lb.set(s.index + 1);
                if (e.key === "ArrowLeft" && s.index > 0) lb.set(s.index - 1);
              }}
            >
              <D.Title className="sr-only">{img.alt}</D.Title>
              <D.Description className="sr-only">{img.alt}</D.Description>
              <motion.img
                key={img.src}
                layoutId={reduced ? undefined : `${s.group}-${s.index}`}
                src={img.src}
                alt={img.alt}
                className="max-h-full max-w-full rounded-[16px] object-contain"
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              />
              <D.Close asChild>
                <IconButton
                  aria-label={closeLabel}
                  variant="soft"
                  className="absolute top-[max(16px,env(safe-area-inset-top))] right-4"
                >
                  <X aria-hidden />
                </IconButton>
              </D.Close>
              {s.images.length > 1 ? (
                <>
                  <IconButton
                    aria-label={prevLabel}
                    variant="soft"
                    className="absolute left-4"
                    disabled={s.index === 0}
                    onClick={() => lb.set(s.index - 1)}
                  >
                    <ChevronLeft aria-hidden />
                  </IconButton>
                  <IconButton
                    aria-label={nextLabel}
                    variant="soft"
                    className="absolute right-4"
                    disabled={s.index === s.images.length - 1}
                    onClick={() => lb.set(s.index + 1)}
                  >
                    <ChevronRight aria-hidden />
                  </IconButton>
                </>
              ) : null}
            </D.Content>
          </D.Portal>
        ) : null}
      </AnimatePresence>
    </D.Root>
  );
}
