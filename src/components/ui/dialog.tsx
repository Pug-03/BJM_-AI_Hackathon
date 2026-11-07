"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dropIn, sheetUp, useReducedMotion, variantsFor } from "@/lib/motion";
import { IconButton } from "./icon-button";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const DialogCtx = React.createContext<Ctx | null>(null);
function useDialogCtx() {
  const c = React.useContext(DialogCtx);
  if (!c) throw new Error("Dialog parts must be inside <Dialog>");
  return c;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/** Radix dialog (focus trap, return focus, Esc) animated with motion. */
export function Dialog({ open: openProp, defaultOpen, onOpenChange, children }: DialogProps) {
  const [inner, setInner] = React.useState(defaultOpen ?? false);
  const open = openProp ?? inner;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInner(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );
  return (
    <DialogCtx.Provider value={{ open, setOpen }}>
      <D.Root open={open} onOpenChange={setOpen}>
        {children}
      </D.Root>
    </DialogCtx.Provider>
  );
}

export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export interface DialogContentProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Visually hide the title (still read by screen readers). */
  hideTitle?: boolean;
  closeLabel?: string;
  className?: string;
  children?: React.ReactNode;
  /** Render as bottom sheet on mobile (<768px) — default true. */
  sheetOnMobile?: boolean;
  /** Always render as a bottom sheet (used by <Sheet>). */
  forceSheet?: boolean;
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export function DialogContent({
  title,
  description,
  hideTitle,
  closeLabel = "Close",
  className,
  children,
  sheetOnMobile = true,
  forceSheet = false,
}: DialogContentProps) {
  const { open, setOpen } = useDialogCtx();
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const asSheet = forceSheet || (sheetOnMobile && mobile);
  const drag = useDragControls();

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <D.Portal forceMount>
          <D.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-[rgba(15,14,18,0.45)]"
              variants={overlay}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          </D.Overlay>
          <div
            className={cn(
              "pointer-events-none fixed inset-0 z-50 flex justify-center",
              asSheet ? "items-end" : "items-center p-4",
            )}
          >
          <D.Content asChild forceMount>
            <motion.div
              className={cn(
                "pointer-events-auto flex flex-col bg-paper text-ink shadow-dialog focus:outline-none",
                asSheet
                  ? "max-h-[92dvh] w-full max-w-2xl rounded-t-[28px] pb-[max(env(safe-area-inset-bottom),16px)]"
                  : "max-h-[88dvh] w-full max-w-lg rounded-[28px]",
                className,
              )}
              variants={variantsFor(asSheet ? sheetUp : dropIn, reduced)}
              initial="initial"
              animate="animate"
              exit="exit"
              drag={asSheet && !reduced ? "y" : false}
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={onDragEnd}
            >
              {asSheet ? (
                <div
                  className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center"
                  onPointerDown={(e) => drag.start(e)}
                  aria-hidden
                >
                  <span className="h-1 w-10 rounded-full bg-line" />
                </div>
              ) : null}
              <div className={cn("flex items-start gap-4 px-6", asSheet ? "pt-1" : "pt-6")}>
                <div className="min-w-0 flex-1">
                  <D.Title className={cn("text-h3 text-ink", hideTitle && "sr-only")}>{title}</D.Title>
                  {description ? (
                    <D.Description className="mt-1 text-small text-graphite">{description}</D.Description>
                  ) : (
                    <D.Description className="sr-only">{typeof title === "string" ? title : ""}</D.Description>
                  )}
                </div>
                <D.Close asChild>
                  <IconButton aria-label={closeLabel} className="-mt-1 -mr-2">
                    <X aria-hidden />
                  </IconButton>
                </D.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">{children}</div>
            </motion.div>
          </D.Content>
          </div>
        </D.Portal>
      ) : null}
    </AnimatePresence>
  );
}

/** Bottom sheet on every viewport. */
export function SheetContent(props: Omit<DialogContentProps, "forceSheet" | "sheetOnMobile">) {
  return <DialogContent {...props} forceSheet />;
}
export { Dialog as Sheet, DialogTrigger as SheetTrigger, DialogClose as SheetClose };
