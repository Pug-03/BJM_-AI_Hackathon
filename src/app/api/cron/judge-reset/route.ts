import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/log";
import { resetSandbox } from "@/server/judge-core";

/** Vercel Cron: deletes judge sandboxes older than 24 hours. Auth: Bearer CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await db.judgeSandbox.findMany({ where: { seededAt: { lt: cutoff } } });
  for (const sb of stale) await resetSandbox(sb);
  log.info("judge.reset", { count: stale.length });
  return NextResponse.json({ reset: stale.length });
}
