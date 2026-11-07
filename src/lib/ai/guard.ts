import "server-only";
import { db } from "@/lib/db";
import { services } from "@/lib/env";
import { limits, rateLimit } from "@/lib/rate-limit";

export type AiGateError = "auth" | "unavailable" | "consent" | "rate_limited";

/** Latest AI_PROCESSING consent record decides (withdrawable in Settings). */
export async function hasAiConsent(userId: string) {
  const last = await db.consentRecord.findFirst({
    where: { userId, kind: "AI_PROCESSING" },
    orderBy: { createdAt: "desc" },
    select: { granted: true },
  });
  return Boolean(last?.granted);
}

/** Every AI call passes this gate: service configured, consent given, rate limit (section 9). */
export async function aiGate(
  userId: string | null | undefined,
  service: "speech" | "ai",
): Promise<{ ok: true } | { ok: false; error: AiGateError; retryAfter?: number }> {
  if (!userId) return { ok: false, error: "auth" };
  if (!services[service]()) return { ok: false, error: "unavailable" };
  if (!(await hasAiConsent(userId))) return { ok: false, error: "consent" };
  const rl = await rateLimit(`ai:${userId}`, limits.ai.max, limits.ai.windowSec);
  if (!rl.ok) return { ok: false, error: "rate_limited", retryAfter: rl.retryAfter };
  return { ok: true };
}
