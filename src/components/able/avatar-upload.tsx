"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cropToWebp, uploadFile, type UploadErr } from "@/lib/upload-client";

/** Avatar with upload + circular crop (section 4.5). Calls onChange with the stored URL. */
export function AvatarUpload({
  value,
  name,
  onChange,
  size = "xl",
}: {
  value: string | null;
  name: string;
  onChange: (url: string | null) => Promise<void> | void;
  size?: "lg" | "xl";
}) {
  const t = useTranslations("onboard");
  const tc = useTranslations("common");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1.2);
  const [area, setArea] = React.useState<Area | null>(null);
  const [busy, setBusy] = React.useState(false);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error(t("uploadErrors.bad_type"));
      return;
    }
    setSrc(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      const blob = await cropToWebp(src, area);
      const res = await uploadFile("avatars", blob, { name: "avatar.webp" });
      if (!res.ok) {
        toast.error(t(`uploadErrors.${res.error as UploadErr}`));
        return;
      }
      await onChange(res.url);
      setSrc(null);
    } catch {
      toast.error(t("uploadErrors.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar src={value} name={name} size={size} alt={name} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          <Camera aria-hidden />
          {value ? t("photoChange") : t("photoUpload")}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => void onChange(null)}>
            <Trash2 aria-hidden />
            {t("photoRemove")}
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <Dialog open={src !== null} onOpenChange={(o) => !o && setSrc(null)}>
        <DialogContent title={t("cropTitle")} closeLabel={tc("close")}>
          <div className="bg-ink relative aspect-square w-full overflow-hidden rounded-[20px]">
            {src ? (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setArea(px)}
              />
            ) : null}
          </div>
          <label className="text-small mt-4 flex items-center gap-3">
            <span className="shrink-0 font-medium">{t("cropZoom")}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-11 w-full accent-[var(--brand)]"
            />
          </label>
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setSrc(null)}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={() => void save()} loading={busy}>
              {busy ? t("uploading") : t("cropSave")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
