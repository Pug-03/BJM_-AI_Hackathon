"use server";

import { z } from "zod";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const roleSchema = z.enum(["TALENT", "EMPLOYER"]);

export type ChooseRoleResult = { ok: true; href: string } | { ok: false; error: "auth" | "invalid" };

/** Sets the primary role chosen on /welcome and returns where onboarding continues. */
export async function chooseRole(role: string): Promise<ChooseRoleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth" };
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const locale = await getLocale();
  if (user.role !== "ADMIN") {
    await db.user.update({ where: { id: user.id }, data: { role: parsed.data, locale } });
  }
  await db.auditLog.create({
    data: { actorUserId: user.id, action: "account.role_chosen", meta: { role: parsed.data } },
  });
  return { ok: true, href: parsed.data === "TALENT" ? "/onboarding/talent" : "/onboarding/employer" };
}
