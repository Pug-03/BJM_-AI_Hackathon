"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { toWebp, uploadFile } from "@/lib/upload-client";
import { createPost } from "@/server/talent";

export interface NewPost {
  id: string;
  kind: "WORK" | "PHOTO";
  text: string | null;
  images: string[];
  imageAlts: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
}

/** "+ New post": text + up to 10 images (resized to WebP before upload). */
export function PostComposer({ onCreated }: { onCreated: (p: NewPost) => void }) {
  const t = useTranslations("profile");
  const to = useTranslations("onboard");
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState<"upload" | "post" | null>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy("upload");
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 10 - images.length)) {
      const r = await uploadFile("posts", await toWebp(f), { name: f.name });
      if (r.ok) urls.push(r.url);
      else toast.error(to(`uploadErrors.${r.error}`));
    }
    setImages((x) => [...x, ...urls]);
    setBusy(null);
  };

  const publish = async () => {
    setBusy("post");
    const kind = images.length && !text.trim() ? "PHOTO" : "WORK";
    const r = await createPost({ kind, text, images, imageAlts: images.map(() => text.slice(0, 120)) });
    setBusy(null);
    if (!r.ok || !r.data) return toast.error(to("saveFailed"));
    onCreated({
      id: r.data.id,
      kind,
      text: text || null,
      images,
      imageAlts: images.map(() => text.slice(0, 120)),
      likeCount: 0,
      commentCount: 0,
      liked: false,
      createdAt: new Date().toISOString(),
    });
    setText("");
    setImages([]);
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
        <ImagePlus aria-hidden />
        {t("newPost")}
      </Button>
    );
  }
  return (
    <div className="border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-4">
      <label htmlFor="post-text" className="sr-only">
        {t("newPost")}
      </label>
      <Textarea
        id="post-text"
        rows={3}
        maxLength={3000}
        placeholder={t("postPlaceholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {images.length ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li key={src} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-20 rounded-[12px] object-cover" />
              <button
                type="button"
                aria-label={`${to("remove")} ${i + 1}`}
                onClick={() => setImages((x) => x.filter((y) => y !== src))}
                className="bg-ink text-paper absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full before:absolute before:-inset-2"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-small hover:bg-mist has-[:focus-visible]:outline-brand flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 has-[:focus-visible]:outline-2">
          {busy === "upload" ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-5" aria-hidden />
          )}
          {t("postAddImages")}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => void add(e.target.files)}
          />
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {to("back")}
          </Button>
          <Button
            onClick={() => void publish()}
            loading={busy === "post"}
            disabled={!text.trim() && !images.length}
          >
            {t("postPublish")}
          </Button>
        </div>
      </div>
    </div>
  );
}
