"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { deleteObject } from "@/lib/storage";
import { notify } from "@/lib/notify";

const kinds = z.enum(["IDENTITY", "DISABILITY_CARD"]);
export type VerificationKind = z.infer<typeof kinds>;

export interface VerificationStatus {
  kind: VerificationKind;
  state: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  at: string | null;
}

/** My verification state per kind (talent only). */
export async function myVerifications(): Promise<VerificationStatus[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const [t, reqs] = await Promise.all([
    db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { identityVerifiedAt: true, disabilityCardVerifiedAt: true },
    }),
    db.verificationRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!t) return null;
  return (["IDENTITY", "DISABILITY_CARD"] as const).map((kind) => {
    const verifiedAt = kind === "IDENTITY" ? t.identityVerifiedAt : t.disabilityCardVerifiedAt;
    if (verifiedAt) return { kind, state: "APPROVED", reason: null, at: verifiedAt.toISOString() };
    const last = reqs.find((r) => r.kind === kind);
    if (!last) return { kind, state: "NONE", reason: null, at: null };
    return {
      kind,
      state: last.status as VerificationStatus["state"],
      reason: last.reason,
      at: last.createdAt.toISOString(),
    };
  });
}

/**
 * Submit documents for review. Files must be this user's own uploads in the private
 * "verification" bucket. Identity needs an ID card photo + a selfie holding it.
 */
export async function submitVerification(kind: string, files: string[]) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "auth" };
  const k = kinds.safeParse(kind);
  const f = z.array(z.string().max(300)).min(1).max(3).safeParse(files);
  if (!k.success || !f.success) return { ok: false as const, error: "invalid" };
  if (k.data === "IDENTITY" && f.data.length < 2) return { ok: false as const, error: "need_two" };
  if (f.data.some((ref) => !new RegExp(`^(sb|local)://verification/${user.id}/`).test(ref)))
    return { ok: false as const, error: "invalid" };
  const talent = await db.talentProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!talent) return { ok: false as const, error: "no_profile" };
  if (!(await rateLimit(`verify:${user.id}`, 5, 24 * 3600)).ok)
    return { ok: false as const, error: "rate_limited" };
  const pending = await db.verificationRequest.findFirst({
    where: { userId: user.id, kind: k.data, status: "PENDING" },
  });
  if (pending) return { ok: false as const, error: "pending" };
  await db.verificationRequest.create({ data: { userId: user.id, kind: k.data, files: f.data } });
  await db.auditLog.create({
    data: { actorUserId: user.id, action: "verification.submitted", meta: { kind: k.data } },
  });
  return { ok: true as const };
}

/** Admin decision. Documents are deleted immediately either way; only the outcome is kept. */
export async function reviewVerification(id: string, approve: boolean, reason?: string) {
  const admin = await getCurrentUser();
  if (admin?.role !== "ADMIN") return { ok: false };
  const req = await db.verificationRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") return { ok: false };
  for (const ref of req.files) await deleteObject(ref).catch(() => {});
  await db.verificationRequest.update({
    where: { id },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      reason: approve ? null : reason?.slice(0, 300) || null,
      reviewerId: admin.id,
      reviewedAt: new Date(),
      files: [],
    },
  });
  if (approve) {
    await db.talentProfile.updateMany({
      where: { userId: req.userId },
      data:
        req.kind === "IDENTITY"
          ? { identityVerifiedAt: new Date(), verifyTier: 3 }
          : { disabilityCardVerifiedAt: new Date() },
    });
  }
  await db.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: approve ? "verification.approved" : "verification.rejected",
      meta: { kind: req.kind, requestId: id },
    },
  });
  await notify(req.userId, approve ? "VERIFIED" : "VERIFY_REJECTED", { kind: req.kind });
  return { ok: true };
}
