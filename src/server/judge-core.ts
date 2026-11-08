import "server-only";
import { db } from "@/lib/db";
import { createSandbox, deleteUserData } from "./seed-core";
import { recomputeForNeed, recomputeForTalent } from "@/lib/match-jobs";
import { recomputeNeed, recomputeTalent } from "@/lib/match-engine";
import { log } from "@/lib/log";

export const JUDGE_COOKIE = "able_judge_id";
export const JUDGE_TTL_MS = 24 * 60 * 60 * 1000;

/** Removes a sandbox's two accounts and everything they created. Only ever deletes isSandbox users. */
export async function resetSandbox(sb: { id: string; talentUserId: string; employerUserId: string }) {
  for (const uid of [sb.talentUserId, sb.employerUserId]) {
    const exists = await db.user.findUnique({ where: { id: uid }, select: { id: true, isSandbox: true } });
    if (exists?.isSandbox) await deleteUserData(db, uid);
  }
  await db.judgeSandbox.deleteMany({ where: { id: sb.id } });
}

/** Returns a fresh (< 24 h) sandbox for this judge id, re-seeding it when stale or missing. */
export async function ensureSandbox(judgeId: string) {
  const existing = await db.judgeSandbox.findUnique({ where: { id: judgeId } });
  if (existing && Date.now() - existing.seededAt.getTime() < JUDGE_TTL_MS) {
    const both = await db.user.count({
      where: { id: { in: [existing.talentUserId, existing.employerUserId] } },
    });
    if (both === 2) return existing;
  }
  if (existing) await resetSandbox(existing);
  const sb = await createSandbox(db, judgeId);
  await scoreSandbox(sb);
  return db.judgeSandbox.upsert({
    where: { id: judgeId },
    create: { id: judgeId, talentUserId: sb.talentUserId, employerUserId: sb.employerUserId },
    update: { talentUserId: sb.talentUserId, employerUserId: sb.employerUserId, seededAt: new Date() },
  });
}

/** Populate both sandbox feeds on entry (embeddings when available, lexical if that fails). */
async function scoreSandbox(sb: { talentUserId: string; employerUserId: string }) {
  const [talent, needs] = await Promise.all([
    db.talentProfile.findUnique({ where: { userId: sb.talentUserId }, select: { id: true } }),
    db.hiringNeed.findMany({ where: { org: { userId: sb.employerUserId } }, select: { id: true } }),
  ]);
  const jobs: Promise<unknown>[] = needs.map((n) =>
    recomputeForNeed(n.id).catch((e) => {
      log.warn("judge.score_fallback", { message: e instanceof Error ? e.message.slice(0, 80) : "unknown" });
      return recomputeNeed(db, n.id);
    }),
  );
  if (talent) jobs.push(recomputeForTalent(talent.id).catch(() => recomputeTalent(db, talent.id)));
  await Promise.all(jobs);
}
