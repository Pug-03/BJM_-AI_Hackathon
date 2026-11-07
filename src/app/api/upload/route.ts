import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit, limits } from "@/lib/rate-limit";
import { buckets, putObject, storageAvailable, validateUpload } from "@/lib/storage";
import { log } from "@/lib/log";

const bucketSchema = z.enum(buckets);

/**
 * Upload a file. Body: multipart form with `bucket` and `file` (and `conversationId` for chat).
 * Images are resized to WebP on the client before upload; the server sniffs the real type.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!storageAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const rl = await rateLimit(`upload:${user.id}`, limits.upload.max, limits.upload.windowSec);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const bucket = bucketSchema.safeParse(form?.get("bucket"));
  const file = form?.get("file");
  if (!bucket.success || !(file instanceof File))
    return NextResponse.json({ error: "invalid" }, { status: 400 });

  let owner = user.id;
  if (bucket.data === "chat") {
    const conversationId = String(form?.get("conversationId") ?? "");
    const convo = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ talentUserId: user.id }, { employerUserId: user.id }],
        blockedBy: null,
      },
      select: { id: true },
    });
    if (!convo) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    owner = convo.id;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bucket.data, bytes);
  if (!check.ok)
    return NextResponse.json({ error: check.error }, { status: check.error === "too_large" ? 413 : 415 });
  try {
    const url = await putObject(bucket.data, owner, bytes, check.type);
    await db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "file.upload",
        meta: { bucket: bucket.data, bytes: bytes.byteLength },
      },
    });
    return NextResponse.json({ url, type: check.type });
  } catch (e) {
    log.error("upload.failed", { message: e instanceof Error ? e.message : "unknown" });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
