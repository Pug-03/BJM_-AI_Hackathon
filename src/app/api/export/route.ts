import JSZip from "jszip";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { readLocal, resolveUrl } from "@/lib/storage";
import { fileRefsFor } from "@/server/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

/** "Download my data" (section 7.9): a ZIP with data.json and the files you uploaded. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const rl = await rateLimit(`export:${user.id}`, 5, 3600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const [account, talent, org, consents, conversations, follows, stars, notifications, prefs] =
    await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, name: true, role: true, locale: true, createdAt: true },
      }),
      db.talentProfile.findUnique({
        where: { userId: user.id },
        include: {
          skills: true,
          educations: true,
          certificates: true,
          portfolio: true,
          posts: true,
          contacts: true,
        },
      }),
      db.orgProfile.findUnique({ where: { userId: user.id }, include: { contacts: true, needs: true } }),
      db.consentRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
      db.conversation.findMany({
        where: { OR: [{ talentUserId: user.id }, { employerUserId: user.id }] },
        include: { messages: { where: { senderUserId: user.id }, orderBy: { createdAt: "asc" } } },
      }),
      db.follow.findMany({ where: { followerId: user.id } }),
      db.star.findMany({ where: { employerUserId: user.id } }),
      db.notification.findMany({ where: { userId: user.id } }),
      db.notificationPrefs.findUnique({ where: { userId: user.id } }),
    ]);
  const { embedding: _e, ...talentData } = (talent ?? {}) as Record<string, unknown>;
  const zip = new JSZip();
  zip.file(
    "data.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        note: "Your ABLE data. Messages include only what you sent; other people's messages are theirs.",
        account,
        talentProfile: talent ? talentData : null,
        organization: org ? { ...org, embedding: undefined } : null,
        consents,
        conversations: conversations.map((c) => ({
          id: c.id,
          createdAt: c.createdAt,
          messagesYouSent: c.messages,
        })),
        following: follows,
        starred: stars,
        notifications,
        notificationPrefs: prefs,
      },
      null,
      2,
    ),
  );
  const files = zip.folder("files")!;
  for (const ref of await fileRefsFor(user.id, "own")) {
    try {
      const m = ref.match(/^(?:local:\/\/|\/api\/files\/)([a-z]+)\/(.+)$/);
      let buf: Uint8Array | null = null;
      if (m) buf = await readLocal(m[1]!, m[2]!);
      else {
        const url = await resolveUrl(ref);
        if (url.startsWith("https://")) buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      }
      if (buf) files.file(ref.split("/").slice(-2).join("-"), buf);
    } catch {
      // Skip a file that can't be read; the JSON still lists its reference.
    }
  }
  const body = await zip.generateAsync({ type: "uint8array" });
  await db.auditLog.create({ data: { actorUserId: user.id, action: "data.export", meta: {} } });
  return new NextResponse(Buffer.from(body), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="able-data-${new Date().toISOString().slice(0, 10)}.zip"`,
      "cache-control": "no-store",
    },
  });
}
