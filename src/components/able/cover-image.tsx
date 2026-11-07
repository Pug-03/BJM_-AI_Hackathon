"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ImagePlus, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { toWebp, uploadFile } from "@/lib/upload-client";
import { saveCoverOffset, saveProfileImage } from "@/server/talent";

/** 16:5 cover with upload and drag/keyboard reposition for the owner (section 4.5). */
export function CoverImage({
  src,
  offsetY,
  editable,
}: {
  src: string | null;
  offsetY: number;
  editable: boolean;
}) {
  const t = useTranslations("profile");
  const to = useTranslations("onboard");
  const [url, setUrl] = React.useState(src);
  const [y, setY] = React.useState(offsetY);
  const [moving, setMoving] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ startY: number; startOffset: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    const r = await uploadFile("covers", await toWebp(f), { name: "cover.webp" });
    if (!r.ok) {
      setBusy(false);
      toast.error(to(`uploadErrors.${r.error}`));
      return;
    }
    const s = await saveProfileImage("cover", r.url, 50);
    setBusy(false);
    if (s.ok) {
      setUrl(r.url);
      setY(50);
      setMoving(true);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!moving) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startOffset: y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const h = ref.current.clientHeight;
    const delta = ((e.clientY - drag.current.startY) / h) * -100;
    setY(Math.max(0, Math.min(100, drag.current.startOffset + delta)));
  };
  const end = () => (drag.current = null);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-mist relative aspect-[16/7] w-full overflow-hidden sm:aspect-[16/5] md:rounded-[20px]",
        moving && "cursor-grab touch-none active:cursor-grabbing",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          fetchPriority="high"
          draggable={false}
          className="size-full object-cover select-none"
          style={{ objectPosition: `50% ${y}%` }}
        />
      ) : null}
      {editable ? (
        <div className="absolute right-3 bottom-3 flex flex-wrap items-center justify-end gap-2">
          {moving ? (
            <>
              <span
                className="bg-paper/90 text-caption text-ink flex h-9 items-center gap-1.5 rounded-full px-3 backdrop-blur"
                aria-live="polite"
              >
                <Move className="size-4" aria-hidden />
                {t("coverReposition")}
              </span>
              <IconButton
                aria-label={t("coverUp")}
                variant="soft"
                className="bg-paper/90"
                onClick={() => setY((v) => Math.max(0, v - 10))}
              >
                <ChevronUp aria-hidden />
              </IconButton>
              <IconButton
                aria-label={t("coverDown")}
                variant="soft"
                className="bg-paper/90"
                onClick={() => setY((v) => Math.min(100, v + 10))}
              >
                <ChevronDown aria-hidden />
              </IconButton>
              <Button
                size="sm"
                onClick={async () => {
                  await saveCoverOffset(y);
                  setMoving(false);
                }}
              >
                {t("coverSave")}
              </Button>
            </>
          ) : (
            <>
              {url ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-paper/90 backdrop-blur"
                  onClick={() => setMoving(true)}
                >
                  <Move aria-hidden />
                  {t("coverReposition")}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                className="bg-paper/90 backdrop-blur"
                loading={busy}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus aria-hidden />
                {t("coverEdit")}
              </Button>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
