"use client";

import * as React from "react";
import { Dialog, DialogContent } from "./dialog";
import { Button } from "./button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  /** When set, the user must type this exact text to enable confirm. */
  requireText?: string;
  requireTextLabel?: string;
  onConfirm: () => void | Promise<void>;
  closeLabel?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  requireText,
  requireTextLabel,
  onConfirm,
  closeLabel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState("");
  const ok = !requireText || typed.trim() === requireText;
  // Opened via `open` (no Radix trigger), so remember the opener and return focus to it on close.
  const opener = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
    } else {
      setTyped("");
      const el = opener.current;
      if (el) setTimeout(() => el.focus(), 0);
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} closeLabel={closeLabel}>
        {requireText ? (
          <div className="mb-6 flex flex-col gap-2">
            <label htmlFor="confirm-text" className="text-small font-medium">
              {requireTextLabel}
            </label>
            <input
              id="confirm-text"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="bg-mist focus:outline-brand h-12 rounded-[14px] px-4 focus:outline-2"
            />
          </div>
        ) : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            disabled={!ok}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
