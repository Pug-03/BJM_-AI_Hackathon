import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { privateBuckets, readLocal, sniffType, type Bucket } from "@/lib/storage";

/** Serves locally stored files (development without Supabase). Private buckets are authorized per request. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [bucket, ...rest] = path;
  const key = rest.join("/");
  if (!bucket || !key) return new NextResponse(null, { status: 404 });

  if (privateBuckets.includes(bucket as Bucket)) {
    const user = await getCurrentUser();
    const ownerId = rest[0]!;
    let allowed = Boolean(user && user.id === ownerId);
    if (!allowed && bucket === "certificates") {
      const cert = await db.certificate.findFirst({
        where: { fileUrl: `local://certificates/${key}`, isPublic: true, talent: { isPublic: true } },
        select: { id: true },
      });
      allowed = Boolean(cert);
    }
    if (!allowed && bucket === "chat" && user) {
      const convo = await db.conversation.findFirst({
        where: { id: ownerId, OR: [{ talentUserId: user.id }, { employerUserId: user.id }] },
        select: { id: true },
      });
      allowed = Boolean(convo);
    }
    if (!allowed && bucket === "verification" && user?.role === "ADMIN") allowed = true;
    if (!allowed) return new NextResponse(null, { status: 403 });
  }

  const buf = await readLocal(bucket, key);
  if (!buf) return new NextResponse(null, { status: 404 });
  const type = sniffType(new Uint8Array(buf.subarray(0, 16))) ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": type,
      "cache-control": privateBuckets.includes(bucket as Bucket)
        ? "private, max-age=300"
        : "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
