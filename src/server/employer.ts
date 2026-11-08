"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { deleteObject } from "@/lib/storage";
import { needSchema, orgAboutSchema, orgBasicsSchema } from "@/lib/schemas/employer";
import { checkHandle, type ActionResult } from "./talent";
import { onNeedChanged } from "./hooks";

async function me() {
  const user = await getCurrentUser();
  if (!user || (user.role && user.role !== "EMPLOYER")) return null;
  return user;
}
async function myOrg(userId: string) {
  return db.orgProfile.findUnique({ where: { userId }, select: { id: true, logoUrl: true, coverUrl: true } });
}

/** Step 1 — who you are. Creates the organization on first save. */
export async function saveOrgBasics(input: unknown): Promise<ActionResult> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  const p = orgBasicsSchema.safeParse(input);
  if (!p.success)
    return {
      ok: false,
      error: p.error.issues[0]?.message === "handle_format" ? "handle_format" : "invalid",
      field: p.error.issues[0]?.path.join("."),
    };
  const h = await checkHandle(p.data.handle);
  if (!h.ok || !h.data?.available) return { ok: false, error: "handle_taken", field: "handle" };
  const d = p.data;
  const data = {
    type: d.type,
    name: d.name,
    handle: d.handle,
    country: d.country,
    province: d.province ?? null,
    website: d.website ?? null,
    employeeCount: d.employeeCount ?? null,
    currentHires: d.currentHires ?? null,
    registrationNo: d.registrationNo ?? null,
  };
  const existing = await db.orgProfile.findUnique({
    where: { userId: user.id },
    select: { registrationNo: true },
  });
  await db.orgProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data, verifyRequestedAt: d.registrationNo ? new Date() : null },
    update: {
      ...data,
      // A new registration number asks an admin to verify (tier 2); it is never shown publicly.
      ...(d.registrationNo && d.registrationNo !== existing?.registrationNo
        ? { verifyRequestedAt: new Date() }
        : {}),
    },
  });
  await db.user.update({ where: { id: user.id }, data: { role: "EMPLOYER" } });
  return { ok: true };
}

export async function saveOrgImage(kind: "logo" | "cover", url: string): Promise<ActionResult> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  if (!/^(\/api\/files\/|https:\/\/)/.test(url) && url !== "") return { ok: false, error: "invalid" };
  const org = await myOrg(user.id);
  if (!org) return { ok: false, error: "no_profile" };
  const old = kind === "logo" ? org.logoUrl : org.coverUrl;
  await db.orgProfile.update({
    where: { id: org.id },
    data: kind === "logo" ? { logoUrl: url || null } : { coverUrl: url || null },
  });
  if (kind === "logo") await db.user.update({ where: { id: user.id }, data: { image: url || null } });
  if (old && old !== url && !old.startsWith("/sample/")) await deleteObject(old).catch(() => {});
  return { ok: true };
}

/** Step 2 — about + contact channels. */
export async function saveOrgAbout(input: unknown): Promise<ActionResult> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  const p = orgAboutSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "invalid", field: p.error.issues[0]?.path.join(".") };
  const org = await myOrg(user.id);
  if (!org) return { ok: false, error: "no_profile" };
  await db.$transaction([
    db.orgProfile.update({
      where: { id: org.id },
      data: { description: p.data.description ?? null, industry: p.data.industry ?? null },
    }),
    db.contactChannel.deleteMany({ where: { orgId: org.id } }),
    db.contactChannel.createMany({ data: p.data.contacts.map((c) => ({ ...c, orgId: org.id })) }),
  ]);
  return { ok: true };
}

/** Create or update a hiring need (position). Scores recompute in the background. */
export async function saveNeed(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  const p = needSchema.safeParse(input);
  if (!p.success)
    return {
      ok: false,
      error: p.error.issues[0]?.message === "age_range" ? "age_range" : "invalid",
      field: p.error.issues[0]?.path.join("."),
    };
  const org = await myOrg(user.id);
  if (!org) return { ok: false, error: "no_profile" };
  const { id, ...d } = p.data;
  const data = {
    ...d,
    location: d.location ?? null,
    educationLevel: d.educationLevel ?? null,
    ageMin: d.ageMin ?? null,
    ageMax: d.ageMax ?? null,
    description: d.description ?? null,
  };
  let needId = id;
  if (id) {
    const own = await db.hiringNeed.findFirst({ where: { id, orgId: org.id }, select: { id: true } });
    if (!own) return { ok: false, error: "not_found" };
    await db.hiringNeed.update({ where: { id }, data });
  } else {
    needId = (await db.hiringNeed.create({ data: { ...data, orgId: org.id } })).id;
  }
  onNeedChanged(needId!);
  revalidatePath("/[locale]/needs", "page");
  revalidatePath("/[locale]/feed", "page");
  return { ok: true, data: { id: needId! } };
}

export async function setNeedOpen(id: string, isOpen: boolean): Promise<ActionResult> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  const r = await db.hiringNeed.updateMany({ where: { id, org: { userId: user.id } }, data: { isOpen } });
  if (!r.count) return { ok: false, error: "not_found" };
  if (isOpen) onNeedChanged(id);
  revalidatePath("/[locale]/needs", "page");
  return { ok: true };
}

export async function deleteNeed(id: string): Promise<ActionResult> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  const r = await db.hiringNeed.deleteMany({ where: { id, org: { userId: user.id } } });
  if (!r.count) return { ok: false, error: "not_found" };
  revalidatePath("/[locale]/needs", "page");
  return { ok: true };
}

export async function finishEmployerOnboarding(): Promise<ActionResult<{ needId: string | null }>> {
  const user = await me();
  if (!user) return { ok: false, error: "auth" };
  const org = await db.orgProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, needs: { select: { id: true }, take: 1, orderBy: { createdAt: "desc" } } },
  });
  if (!org) return { ok: false, error: "no_profile" };
  await db.auditLog.create({
    data: { actorUserId: user.id, action: "employer.onboarding_finished", meta: {} },
  });
  return { ok: true, data: { needId: org.needs[0]?.id ?? null } };
}
