"use server";

import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { services } from "@/lib/env";
import { log } from "@/lib/log";
import { rateLimit, limits } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { ensureSandbox, JUDGE_COOKIE as COOKIE } from "./judge-core";

const roleSchema = z.enum(["TALENT", "EMPLOYER"]);

export type JudgeResult =
  { ok: true; href: string } | { ok: false; error: "unavailable" | "rate_limited" | "failed" };

async function signInAs(email: string) {
  const h = await headers();
  // Server-only endpoint: issues a code without sending email, then signs in with it.
  const code = await auth.api.createVerificationOTP({ body: { email, type: "sign-in" } });
  const res = await auth.api.signInEmailOTP({ body: { email, otp: code }, headers: h, returnHeaders: true });
  // Copy the session cookies onto this server action's response.
  const jar = await cookies();
  for (const raw of res.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const eq = pair!.indexOf("=");
    const name = pair!.slice(0, eq);
    const value = decodeURIComponent(pair!.slice(eq + 1));
    const opt: Record<string, string> = {};
    for (const a of attrs) {
      const [k, v] = a.split("=");
      opt[k!.toLowerCase()] = v ?? "true";
    }
    jar.set(name, value, {
      httpOnly: "httponly" in opt,
      secure: "secure" in opt,
      sameSite: "lax",
      path: opt.path ?? "/",
      maxAge: opt["max-age"] ? Number(opt["max-age"]) : undefined,
    });
  }
}

/** Signs the browser into its isolated judge sandbox as talent or employer. Works without Google/Resend keys. */
export async function enterJudgeMode(role: string): Promise<JudgeResult> {
  if (!services.database()) return { ok: false, error: "unavailable" };
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "failed" };
  const jar = await cookies();
  const fromCookie = jar.get(COOKIE)?.value;
  const valid = fromCookie && /^[a-f0-9-]{36}$/.test(fromCookie) ? fromCookie : null;
  const judgeId = valid ?? randomUUID();
  const known = valid
    ? await db.judgeSandbox.findUnique({ where: { id: valid }, select: { id: true } })
    : null;
  if (!known) {
    // Only creating a new sandbox is limited; returning to an existing one is free.
    // Judges often share one venue network, so the per-network limit is generous.
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = await rateLimit(`judge-new:${ip}`, limits.judge.max, limits.judge.windowSec);
    if (!rl.ok) return { ok: false, error: "rate_limited" };
  }
  try {
    const sb = await ensureSandbox(judgeId);
    jar.set(COOKIE, judgeId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    const userId = parsed.data === "TALENT" ? sb.talentUserId : sb.employerUserId;
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    await signInAs(user.email);
    await db.auditLog.create({
      data: { actorUserId: userId, action: "judge.enter", meta: { role: parsed.data } },
    });
    return { ok: true, href: "/feed" };
  } catch (e) {
    log.error("judge.enter_failed", { message: e instanceof Error ? e.message.slice(0, 200) : "unknown" });
    return { ok: false, error: "failed" };
  }
}

/** Swaps to the other seeded sandbox account. */
export async function switchJudgeRole(): Promise<JudgeResult> {
  const user = await getCurrentUser();
  if (!user?.isSandbox) return { ok: false, error: "failed" };
  return enterJudgeMode(user.role === "TALENT" ? "EMPLOYER" : "TALENT");
}

/** Signs out of judge mode. The sandbox stays until its 24-hour reset. */
export async function exitJudgeMode(): Promise<{ ok: true }> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {}
  return { ok: true };
}
