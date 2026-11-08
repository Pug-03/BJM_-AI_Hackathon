"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CONSENT_VERSION } from "@/lib/consent";
import { deleteObject } from "@/lib/storage";
import {
  aboutSchema,
  basicsSchema,
  certificateSchema,
  handleSchema,
  portfolioSchema,
  postSchema,
  privacySchema,
  skillsSchema,
  suggestHandle,
} from "@/lib/schemas/talent";
import { onTalentChanged } from "./hooks";
import { notify } from "@/lib/notify";

export type ActionResult<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: string; field?: string };

const RESERVED = new Set([
  "admin",
  "me",
  "api",
  "able",
  "judge",
  "settings",
  "login",
  "explore",
  "feed",
  "help",
]);

async function requireTalent() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

async function myProfileId(userId: string) {
  const p = await db.talentProfile.findUnique({ where: { userId }, select: { id: true } });
  return p?.id ?? null;
}

function invalid(e: z.ZodError): ActionResult {
  const issue = e.issues[0];
  return {
    ok: false,
    error: issue?.message === "handle_format" ? "handle_format" : "invalid",
    field: issue?.path.join("."),
  };
}

/** Is a handle free? (Talent and organizations share one namespace.) */
export async function checkHandle(handle: string): Promise<ActionResult<{ available: boolean }>> {
  const parsed = handleSchema.safeParse(handle);
  if (!parsed.success) return { ok: false, error: "handle_format" };
  const user = await getCurrentUser();
  if (RESERVED.has(parsed.data)) return { ok: true, data: { available: false } };
  const [t, o] = await Promise.all([
    db.talentProfile.findUnique({ where: { handle: parsed.data }, select: { userId: true } }),
    db.orgProfile.findUnique({ where: { handle: parsed.data }, select: { userId: true } }),
  ]);
  const takenByOther = (t && t.userId !== user?.id) || (o && o.userId !== user?.id);
  return { ok: true, data: { available: !takenByOther } };
}

/** Step 1 — basics. Creates the profile on first save (autosave). */
export async function saveBasics(input: unknown): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const h = await checkHandle(d.handle);
  if (!h.ok || !h.data?.available) return { ok: false, error: "handle_taken", field: "handle" };
  const data = {
    firstName: d.firstName,
    lastName: d.lastName,
    displayName: d.displayName,
    handle: d.handle,
    dob: d.dob ? new Date(d.dob) : null,
    showAge: d.showAge ?? false,
    gender: d.gender ?? null,
    country: d.country,
    province: d.province ?? null,
  };
  const p = await db.talentProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data, avatarUrl: user.image },
    update: data,
  });
  await db.user.update({
    where: { id: user.id },
    data: { name: d.displayName, role: user.role ?? "TALENT" },
  });
  onTalentChanged(p.id);
  revalidatePath("/[locale]/me", "page");
  return { ok: true };
}

/** Saves a profile image (avatar or cover) after upload. */
export async function saveProfileImage(
  kind: "avatar" | "cover",
  url: string,
  offsetY?: number,
): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  if (!/^(\/api\/files\/|https:\/\/)/.test(url) && url !== "") return { ok: false, error: "invalid" };
  const p = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, avatarUrl: true, coverUrl: true },
  });
  if (!p) {
    // Photo added before the profile exists (step 1): keep it on the user; saveBasics copies it.
    if (kind !== "avatar") return { ok: false, error: "no_profile" };
    await db.user.update({ where: { id: user.id }, data: { image: url || null } });
    return { ok: true };
  }
  const old = kind === "avatar" ? p.avatarUrl : p.coverUrl;
  await db.talentProfile.update({
    where: { id: p.id },
    data:
      kind === "avatar"
        ? { avatarUrl: url || null }
        : { coverUrl: url || null, coverOffsetY: Math.max(0, Math.min(100, Math.round(offsetY ?? 50))) },
  });
  if (kind === "avatar") await db.user.update({ where: { id: user.id }, data: { image: url || null } });
  if (old && old !== url && !old.startsWith("/sample/")) await deleteObject(old).catch(() => {});
  revalidatePath("/[locale]/me", "page");
  return { ok: true };
}

export async function saveCoverOffset(offsetY: number): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  await db.talentProfile.update({
    where: { userId: user.id },
    data: { coverOffsetY: Math.max(0, Math.min(100, Math.round(offsetY))) },
  });
  return { ok: true };
}

/** Step 2 — about. */
export async function saveAbout(input: unknown): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const id = await myProfileId(user.id);
  if (!id) return { ok: false, error: "no_profile" };
  await db.talentProfile.update({ where: { id }, data: parsed.data });
  onTalentChanged(id);
  return { ok: true };
}

/** Step 3 — education, skills, special talents (replaces the lists). */
export async function saveSkills(input: unknown): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = skillsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const id = await myProfileId(user.id);
  if (!id) return { ok: false, error: "no_profile" };
  const d = parsed.data;
  await db.$transaction([
    db.skill.deleteMany({ where: { talentId: id } }),
    db.skill.createMany({ data: [...new Set(d.skills)].map((name) => ({ talentId: id, name })) }),
    db.education.deleteMany({ where: { talentId: id } }),
    db.education.createMany({
      data: d.educations.map((e) => ({
        talentId: id,
        level: e.level,
        school: e.school,
        field: e.field ?? null,
        yearEnd: e.yearEnd ?? null,
      })),
    }),
    db.talentProfile.update({ where: { id }, data: { specialTalents: d.specialTalents ?? null } }),
  ]);
  onTalentChanged(id);
  return { ok: true };
}

/** Step 4 — add a certificate (file already uploaded). */
export async function addCertificate(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = certificateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const id = await myProfileId(user.id);
  if (!id) return { ok: false, error: "no_profile" };
  const d = parsed.data;
  const c = await db.certificate.create({
    data: {
      talentId: id,
      kind: d.kind,
      title: d.title,
      issuer: d.issuer ?? null,
      issuedAt: d.issuedAt ? new Date(d.issuedAt.length === 7 ? `${d.issuedAt}-01` : d.issuedAt) : null,
      fileUrl: d.fileUrl,
      isPublic: d.isPublic,
    },
  });
  onTalentChanged(id);
  return { ok: true, data: { id: c.id } };
}

export async function removeCertificate(certId: string): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const c = await db.certificate.findFirst({ where: { id: certId, talent: { userId: user.id } } });
  if (!c) return { ok: false, error: "not_found" };
  await db.certificate.delete({ where: { id: c.id } });
  if (!c.fileUrl.startsWith("/sample/")) await deleteObject(c.fileUrl).catch(() => {});
  return { ok: true };
}

export async function addPortfolioItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = portfolioSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const id = await myProfileId(user.id);
  if (!id) return { ok: false, error: "no_profile" };
  const d = parsed.data;
  const item = await db.portfolioItem.create({
    data: {
      talentId: id,
      title: d.title,
      description: d.description ?? null,
      images: d.images,
      imageAlts: d.imageAlts,
      link: d.link ?? null,
    },
  });
  onTalentChanged(id);
  return { ok: true, data: { id: item.id } };
}

export async function removePortfolioItem(itemId: string): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const item = await db.portfolioItem.findFirst({ where: { id: itemId, talent: { userId: user.id } } });
  if (!item) return { ok: false, error: "not_found" };
  await db.portfolioItem.delete({ where: { id: item.id } });
  for (const img of item.images) if (!img.startsWith("/sample/")) await deleteObject(img).catch(() => {});
  return { ok: true };
}

/** Step 5 — contacts, visibility, private work setup, consents. */
export async function savePrivacy(input: unknown): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const id = await myProfileId(user.id);
  if (!id) return { ok: false, error: "no_profile" };
  const d = parsed.data;
  // Work-setup text is stored only with its processing consent.
  const workSetupNeeds = d.consentWorkSetup ? (d.workSetupNeeds ?? null) : null;
  await db.$transaction([
    db.contactChannel.deleteMany({ where: { talentId: id } }),
    db.contactChannel.createMany({ data: d.contacts.map((c) => ({ ...c, talentId: id })) }),
    db.talentProfile.update({ where: { id }, data: { workSetupNeeds, isPublic: d.isPublic } }),
  ]);
  await recordConsent(user.id, "AI_PROCESSING", d.consentAi);
  await recordConsent(user.id, "WORK_SETUP", d.consentWorkSetup);
  return { ok: true };
}

async function recordConsent(userId: string, kind: string, granted: boolean) {
  const last = await db.consentRecord.findFirst({ where: { userId, kind }, orderBy: { createdAt: "desc" } });
  if (last && last.granted === granted && last.version === CONSENT_VERSION) return;
  await db.consentRecord.create({ data: { userId, kind, version: CONSENT_VERSION, granted } });
}

export async function finishOnboarding(): Promise<ActionResult<{ handle: string }>> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const p = await db.talentProfile.findUnique({ where: { userId: user.id }, select: { handle: true } });
  if (!p) return { ok: false, error: "no_profile" };
  await db.auditLog.create({
    data: { actorUserId: user.id, action: "talent.onboarding_finished", meta: {} },
  });
  return { ok: true, data: { handle: p.handle } };
}

export async function suggestMyHandle(first: string, last: string): Promise<string> {
  const base = suggestHandle(first, last);
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.floor(Math.random() * 900 + 100)}`;
    const r = await checkHandle(candidate);
    if (r.ok && r.data?.available) return candidate;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

// ───────────── Posts ─────────────

export async function createPost(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  if (!d.text && d.images.length === 0) return { ok: false, error: "empty" };
  const id = await myProfileId(user.id);
  if (!id) return { ok: false, error: "no_profile" };
  const post = await db.post.create({
    data: { talentId: id, kind: d.kind, text: d.text ?? null, images: d.images, imageAlts: d.imageAlts },
  });
  revalidatePath("/[locale]/me", "page");
  return { ok: true, data: { id: post.id } };
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const user = await requireTalent();
  if (!user) return { ok: false, error: "auth" };
  const post = await db.post.findFirst({ where: { id: postId, talent: { userId: user.id } } });
  if (!post) return { ok: false, error: "not_found" };
  await db.post.delete({ where: { id: post.id } });
  for (const img of post.images) if (!img.startsWith("/sample/")) await deleteObject(img).catch(() => {});
  revalidatePath("/[locale]/me", "page");
  return { ok: true };
}

// ───────────── Follow / star ─────────────

export async function toggleFollow(followeeUserId: string, on: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth" };
  if (followeeUserId === user.id) return { ok: false, error: "invalid" };
  const target = await db.user.findUnique({ where: { id: followeeUserId }, select: { isSandbox: true } });
  if (!target || (target.isSandbox && !user.isSandbox)) return { ok: false, error: "not_found" };
  if (on) {
    await db.follow.upsert({
      where: { followerId_followeeUserId: { followerId: user.id, followeeUserId } },
      update: {},
      create: { followerId: user.id, followeeUserId },
    });
    await notify(followeeUserId, "FOLLOW", { fromUserId: user.id, fromName: user.name });
  } else {
    await db.follow.deleteMany({ where: { followerId: user.id, followeeUserId } });
  }
  return { ok: true };
}

export async function toggleStar(talentId: string, on: boolean, needId?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") return { ok: false, error: "auth" };
  if (on) {
    await db.star.upsert({
      where: { employerUserId_talentId: { employerUserId: user.id, talentId } },
      update: { needId: needId ?? null },
      create: { employerUserId: user.id, talentId, needId: needId ?? null },
    });
    const t = await db.talentProfile.findUnique({ where: { id: talentId }, select: { userId: true } });
    if (t) await notify(t.userId, "STAR", { fromUserId: user.id, fromName: user.name });
  } else {
    await db.star.deleteMany({ where: { employerUserId: user.id, talentId } });
  }
  return { ok: true };
}
