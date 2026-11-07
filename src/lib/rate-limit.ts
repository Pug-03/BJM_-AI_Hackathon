import "server-only";
import { db } from "./db";

/**
 * Fixed-window rate limiter stored in Postgres (shared across serverless instances).
 * Returns { ok: false, retryAfter } when the key has exceeded `max` within `windowSec`.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();
  const k = `able:${key}`;
  try {
    const row = await db.rateLimit.findUnique({ where: { key: k } });
    if (!row || now - Number(row.lastRequest) > windowSec * 1000) {
      await db.rateLimit.upsert({
        where: { key: k },
        create: { key: k, count: 1, lastRequest: BigInt(now) },
        update: { count: 1, lastRequest: BigInt(now) },
      });
      return { ok: true, retryAfter: 0 };
    }
    if (row.count >= max) {
      return { ok: false, retryAfter: Math.ceil((Number(row.lastRequest) + windowSec * 1000 - now) / 1000) };
    }
    await db.rateLimit.update({ where: { key: k }, data: { count: { increment: 1 } } });
    return { ok: true, retryAfter: 0 };
  } catch {
    // Fail open if the database is unavailable; auth endpoints still have Better Auth's limiter.
    return { ok: true, retryAfter: 0 };
  }
}

export const limits = {
  otpPerEmail: { max: 5, windowSec: 15 * 60 },
  ai: { max: 30, windowSec: 60 * 60 },
  upload: { max: 60, windowSec: 60 * 60 },
  message: { max: 60, windowSec: 60 },
  judge: { max: 10, windowSec: 60 * 60 },
} as const;
