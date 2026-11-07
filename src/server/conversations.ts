"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export type StartResult =
  { ok: true; id: string } | { ok: false; error: "auth" | "not_found" | "blocked" | "role" };

/** Opens (or reuses) the one conversation between a talent and an employer. */
export async function startConversation(otherUserId: string): Promise<StartResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "auth" };
  const other = await db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, role: true, isSandbox: true },
  });
  if (!other || other.id === me.id || (other.isSandbox && !me.isSandbox))
    return { ok: false, error: "not_found" };
  const pair =
    me.role === "EMPLOYER" && other.role === "TALENT"
      ? { talentUserId: other.id, employerUserId: me.id }
      : me.role === "TALENT" && other.role === "EMPLOYER"
        ? { talentUserId: me.id, employerUserId: other.id }
        : null;
  if (!pair) return { ok: false, error: "role" };
  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { blockerUserId: me.id, blockedUserId: other.id },
        { blockerUserId: other.id, blockedUserId: me.id },
      ],
    },
  });
  if (blocked) return { ok: false, error: "blocked" };
  const convo = await db.conversation.upsert({
    where: { talentUserId_employerUserId: pair },
    update: {},
    create: pair,
  });
  return { ok: true, id: convo.id };
}
