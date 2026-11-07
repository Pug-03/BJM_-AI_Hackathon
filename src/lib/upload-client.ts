"use client";

/**
 * Client-side image preparation (section 2): resize to max 2560px and encode as
 * WebP before upload. PDFs and audio are uploaded as-is. Max 10 MB.
 */
export const MAX_BYTES = 10 * 1024 * 1024;

export async function toWebp(file: File, maxSide = 2560, quality = 0.86): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  return blob ?? file;
}

/** Crops a square region (from react-easy-crop pixels) and encodes WebP. */
export async function cropToWebp(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  size = 800,
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.9));
  if (!blob) throw new Error("crop_failed");
  return blob;
}

export type UploadErr = "too_large" | "bad_type" | "unavailable" | "rate_limited" | "auth" | "failed";

export async function uploadFile(
  bucket: "avatars" | "covers" | "posts" | "certificates" | "chat",
  file: Blob,
  opts: { conversationId?: string; name?: string } = {},
): Promise<{ ok: true; url: string } | { ok: false; error: UploadErr }> {
  if (file.size > MAX_BYTES) return { ok: false, error: "too_large" };
  const fd = new FormData();
  fd.set("bucket", bucket);
  fd.set("file", file, opts.name ?? "upload");
  if (opts.conversationId) fd.set("conversationId", opts.conversationId);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: UploadErr };
    if (!res.ok || !json.url) return { ok: false, error: json.error ?? "failed" };
    return { ok: true, url: json.url };
  } catch {
    return { ok: false, error: "failed" };
  }
}
