import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * File storage behind one small interface.
 * - Production: Supabase Storage (buckets: avatars, covers, posts, certificates, chat, verification).
 *   `certificates` and `chat` are private and served through short-lived signed URLs.
 * - Local development without Supabase keys: files go to `.uploads/` and are served by
 *   /api/files (private buckets still require an authorized request).
 */
export const buckets = ["avatars", "covers", "posts", "certificates", "chat", "verification"] as const;
export type Bucket = (typeof buckets)[number];
export const privateBuckets: Bucket[] = ["certificates", "chat", "verification"];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const allowed: Record<Bucket, string[]> = {
  avatars: ["image/webp", "image/jpeg", "image/png"],
  covers: ["image/webp", "image/jpeg", "image/png"],
  posts: ["image/webp", "image/jpeg", "image/png"],
  certificates: ["image/webp", "image/jpeg", "image/png", "application/pdf"],
  // ID card / selfie / disability card: reviewed by an admin, then deleted.
  verification: ["image/webp", "image/jpeg", "image/png", "application/pdf"],
  chat: [
    "image/webp",
    "image/jpeg",
    "image/png",
    "application/pdf",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
    "audio/mpeg",
  ],
};

/** Detects the real file type from magic bytes — never trust the client's Content-Type. */
export function sniffType(buf: Uint8Array): string | null {
  const b = buf;
  const startsWith = (...xs: number[]) => xs.every((x, i) => b[i] === x);
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return "image/webp";
  if (startsWith(0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  if (startsWith(0x1a, 0x45, 0xdf, 0xa3)) return "audio/webm";
  if (startsWith(0x4f, 0x67, 0x67, 0x53)) return "audio/ogg";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return "audio/mp4";
  if (startsWith(0x49, 0x44, 0x33) || startsWith(0xff, 0xfb)) return "audio/mpeg";
  return null;
}

const ext: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
};

export type UploadError = "too_large" | "bad_type" | "unavailable";

export function validateUpload(
  bucket: Bucket,
  bytes: Uint8Array,
): { ok: true; type: string } | { ok: false; error: UploadError } {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return { ok: false, error: "too_large" };
  const type = sniffType(bytes);
  if (!type || !allowed[bucket].includes(type)) return { ok: false, error: "bad_type" };
  return { ok: true, type };
}

let supa: SupabaseClient | null = null;
function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supa ??= createClient(url, key, { auth: { persistSession: false } });
  return supa;
}

const localRoot = () => path.join(process.cwd(), ".uploads");
const localAllowed = () => process.env.NODE_ENV !== "production" || process.env.ABLE_LOCAL_UPLOADS === "1";

export function storageAvailable(): boolean {
  return Boolean(supabase()) || localAllowed();
}

/** Stored reference: `sb://bucket/key` or `local://bucket/key`. Public buckets resolve to a URL directly. */
export async function putObject(
  bucket: Bucket,
  ownerId: string,
  bytes: Uint8Array,
  type: string,
): Promise<string> {
  const key = `${ownerId}/${randomUUID()}.${ext[type] ?? "bin"}`;
  const client = supabase();
  if (client) {
    const { error } = await client.storage
      .from(bucket)
      .upload(key, bytes, { contentType: type, upsert: false });
    if (error) throw new Error("upload_failed");
    return privateBuckets.includes(bucket)
      ? `sb://${bucket}/${key}`
      : client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
  }
  if (!localAllowed()) throw new Error("unavailable");
  const file = path.join(localRoot(), bucket, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bytes);
  return privateBuckets.includes(bucket) ? `local://${bucket}/${key}` : `/api/files/${bucket}/${key}`;
}

/** Resolves a stored reference to a URL the authorized viewer can load (signed for private files). */
export async function resolveUrl(ref: string, ttlSec = 60 * 10): Promise<string> {
  const m = ref.match(/^(sb|local):\/\/([a-z]+)\/(.+)$/);
  if (!m) return ref; // already a public URL or a bundled sample asset
  const [, kind, bucket, key] = m;
  if (kind === "sb") {
    const client = supabase();
    if (!client) return "";
    const { data } = await client.storage.from(bucket!).createSignedUrl(key!, ttlSec);
    return data?.signedUrl ?? "";
  }
  return `/api/files/${bucket}/${key}`;
}

export async function readLocal(bucket: string, key: string): Promise<Buffer | null> {
  if (!localAllowed() || !buckets.includes(bucket as Bucket) || key.includes("..")) return null;
  try {
    return await fs.readFile(path.join(localRoot(), bucket, key));
  } catch {
    return null;
  }
}

export async function deleteObject(ref: string) {
  const m =
    ref.match(/^(?:sb:\/\/|local:\/\/|\/api\/files\/)([a-z]+)\/(.+)$/) ??
    ref.match(/\/storage\/v1\/object\/public\/([a-z]+)\/(.+)$/);
  if (!m) return;
  const [, bucket, key] = m;
  const client = supabase();
  if (client) await client.storage.from(bucket!).remove([key!]);
  else if (localAllowed()) await fs.rm(path.join(localRoot(), bucket!, key!), { force: true });
}
