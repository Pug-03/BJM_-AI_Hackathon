"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notify";

async function admin() {
  const u = await getCurrentUser();
  return u?.role === "ADMIN" ? u : null;
}

/** Tier 2 "Organization verified": approve or reject a submitted registration number. */
export async function reviewOrg(orgId: string, approve: boolean) {
  const a = await admin();
  if (!a) return { ok: false };
  const org = await db.orgProfile.update({
    where: { id: orgId },
    data: approve ? { verifyTier: 2, verifyRequestedAt: null } : { verifyRequestedAt: null },
    select: { userId: true },
  });
  await db.auditLog.create({
    data: {
      actorUserId: a.id,
      action: approve ? "admin.org_verified" : "admin.org_rejected",
      meta: { orgId },
    },
  });
  if (approve) await notify(org.userId, "VERIFIED", {});
  return { ok: true };
}

export async function resolveReport(id: string) {
  const a = await admin();
  if (!a) return { ok: false };
  await db.report.update({ where: { id }, data: { resolvedAt: new Date() } });
  await db.auditLog.create({
    data: { actorUserId: a.id, action: "admin.report_resolved", meta: { reportId: id } },
  });
  return { ok: true };
}

/** Suspension blocks sign-in immediately (getCurrentUser returns null) and ends sessions. */
export async function setSuspended(userId: string, on: boolean) {
  const a = await admin();
  if (!a || a.id === userId) return { ok: false };
  await db.user.update({ where: { id: userId }, data: { suspendedAt: on ? new Date() : null } });
  if (on) await db.session.deleteMany({ where: { userId } });
  await db.auditLog.create({
    data: {
      actorUserId: a.id,
      action: on ? "admin.user_suspended" : "admin.user_restored",
      meta: { userId },
    },
  });
  return { ok: true };
}
