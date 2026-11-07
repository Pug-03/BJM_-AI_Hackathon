import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { aiGate } from "@/lib/ai/guard";
import { transcriber } from "@/lib/ai";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // OpenAI's upload limit; ~2 minutes of speech is far below it.
const TYPES = /^audio\/(webm|mp4|m4a|x-m4a|mpeg|mp3|wav|x-wav|ogg|aac)/;

/**
 * Speech-to-text for the mic buttons. The audio lives only in memory for this request
 * and is never written to storage (section 9: "voice audio is deleted right after transcription").
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const gate = await aiGate(user?.id, "speech");
  if (!gate.ok) {
    const status = { auth: 401, unavailable: 503, consent: 403, rate_limited: 429 }[gate.error];
    return NextResponse.json({ error: gate.error, retryAfter: gate.retryAfter }, { status });
  }
  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    file = f instanceof File ? f : null;
  } catch {
    file = null;
  }
  if (!file || file.size === 0) return NextResponse.json({ error: "no_audio" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const type = file.type.split(";")[0] ?? "";
  if (!TYPES.test(type)) return NextResponse.json({ error: "bad_type" }, { status: 415 });

  const ext =
    type.includes("mp4") || type.includes("m4a") || type.includes("aac")
      ? "m4a"
      : (type.split("/")[1] ?? "webm").replace("x-", "").replace("mpeg", "mp3");
  const named = new File([await file.arrayBuffer()], `speech.${ext}`, { type });
  const started = Date.now();
  try {
    const { text } = await transcriber.transcribe(named);
    log.info("ai.transcribed", { bytes: file.size, ms: Date.now() - started, chars: text.length });
    return NextResponse.json({ text });
  } catch (e) {
    log.error("ai.transcribe_failed", { kind: e instanceof Error ? e.name : "unknown" });
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
