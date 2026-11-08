"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CONSENT_VERSION } from "@/lib/consent";
import { deleteObject } from "@/lib/storage";
import { log } from "@/lib/log";
import { deleteUserData } from "./seed-core";

export async function updateName(name: string) {
  const user = await getCurrentUser();
  const n = z.string().trim().min(1).max(80).safeParse(name);
  if (!user || !n.success) return { ok: false };
  await db.user.update({ where: { id: user.id }, data: { name: n.data } });
  return { ok: true };
}

const prefsSchema = z.object({
  emailMessages: z.boolean(),
  emailOffers: z.boolean(),
  showViewers: z.boolean(),
  whoCanMessage: z.enum(["EVERYONE", "VERIFIED_ORGS"]),
});

export async function savePrefs(input: unknown) {
  const user = await getCurrentUser();
  const p = prefsSchema.safeParse(input);
  if (!user || !p.success) return { ok: false };
  await db.notificationPrefs.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...p.data },
    update: p.data,
  });
  return { ok: true };
}

export async function setProfileVisibility(input: { isPublic?: boolean; showAge?: boolean }) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const data = z.object({ isPublic: z.boolean().optional(), showAge: z.boolean().optional() }).parse(input);
  await db.talentProfile.updateMany({ where: { userId: user.id }, data });
  return { ok: true };
}

const consentKinds = z.enum(["AI_PROCESSING", "WORK_SETUP", "EMAIL_NOTIFICATIONS"]);

/** Grant or withdraw a consent (section 9). Withdrawing the work-setup consent deletes the note. */
export async function setConsent(kind: string, granted: boolean) {
  const user = await getCurrentUser();
  const k = consentKinds.safeParse(kind);
  if (!user || !k.success) return { ok: false };
  await db.consentRecord.create({
    data: { userId: user.id, kind: k.data, version: CONSENT_VERSION, granted },
  });
  if (k.data === "WORK_SETUP" && !granted) {
    await db.talentProfile.updateMany({ where: { userId: user.id }, data: { workSetupNeeds: null } });
    await db.setupShare.deleteMany({ where: { talent: { userId: user.id } } });
  }
  if (k.data === "EMAIL_NOTIFICATIONS")
    await db.notificationPrefs.upsert({
      where: { userId: user.id },
      create: { userId: user.id, emailMessages: granted, emailOffers: granted },
      update: { emailMessages: granted, emailOffers: granted },
    });
  return { ok: true };
}

/** Stored file references for this person (export: own uploads; deletion: everything removed with the account). */
export async function fileRefsFor(userId: string, scope: "own" | "all" = "own") {
  const [t, o, convos] = await Promise.all([
    db.talentProfile.findUnique({
      where: { userId },
      select: {
        avatarUrl: true,
        coverUrl: true,
        certificates: { select: { fileUrl: true } },
        portfolio: { select: { images: true } },
        posts: { select: { images: true } },
      },
    }),
    db.orgProfile.findUnique({ where: { userId }, select: { logoUrl: true, coverUrl: true } }),
    db.message.findMany({
      // "all": every file in conversations being deleted with the account.
      where:
        scope === "own"
          ? { senderUserId: userId }
          : { conversation: { OR: [{ talentUserId: userId }, { employerUserId: userId }] } },
      select: { attachments: true },
    }),
  ]);
  const refs = [
    t?.avatarUrl,
    t?.coverUrl,
    ...(t?.certificates.map((c) => c.fileUrl) ?? []),
    ...(t?.portfolio.flatMap((p) => p.images) ?? []),
    ...(t?.posts.flatMap((p) => p.images) ?? []),
    o?.logoUrl,
    o?.coverUrl,
    ...convos.flatMap((m) =>
      Array.isArray(m.attachments) ? (m.attachments as { url: string }[]).map((a) => a.url) : [],
    ),
  ];
  return [...new Set(refs.filter((r): r is string => Boolean(r) && !r!.startsWith("/sample/")))];
}

/**
 * Delete my account (section 7.9): confirm by typing the handle (or email when there's no
 * profile). Hard-deletes personal data and files in this request; keeps anonymous aggregates only.
 */
export async function deleteAccount(
  confirm: string,
): Promise<{ ok: boolean; href?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth" };
  const [t, o] = await Promise.all([
    db.talentProfile.findUnique({ where: { userId: user.id }, select: { handle: true } }),
    db.orgProfile.findUnique({ where: { userId: user.id }, select: { handle: true } }),
  ]);
  const expected = t?.handle ?? o?.handle ?? user.email;
  if (confirm.trim().toLowerCase() !== expected.toLowerCase()) return { ok: false, error: "mismatch" };
  const files = await fileRefsFor(user.id, "all");
  await db.aggregateCounter
    .upsert({
      where: { key: "accounts_deleted" },
      create: { key: "accounts_deleted", value: 1 },
      update: { value: { increment: 1 } },
    })
    .catch(() => {});
  await db.report.deleteMany({ where: { reporterUserId: user.id } });
  await db.auditLog.updateMany({ where: { actorUserId: user.id }, data: { actorUserId: null } });
  await deleteUserData(db, user.id);
  let failed = 0;
  for (const f of files) await deleteObject(f).catch(() => failed++);
  log.info("account.deleted", { files: files.length, failed });
  const jar = await cookies();
  for (const c of jar.getAll())
    if (c.name.includes("better-auth") || c.name === "able_judge_id") jar.delete(c.name);
  return { ok: true, href: "/" };
}
