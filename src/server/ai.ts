"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CONSENT_VERSION } from "@/lib/consent";
import { aiGate, type AiGateError } from "@/lib/ai/guard";
import { structured, AiOutputError } from "@/lib/ai";
import { bioPrompt, structureProfilePrompt } from "@/lib/ai/prompts";
import { bioDraftSchema, cleanDraft, profileDraftSchema, type ProfileDraft } from "@/lib/schemas/ai";
import { log } from "@/lib/log";

type AiResult<T> = { ok: true; data: T } | { ok: false; error: AiGateError | "invalid" | "failed" | "empty" };

/** Records the AI-processing consent asked for inline the first time someone uses a mic or AI button. */
export async function grantAiConsent(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.consentRecord.create({
    data: { userId: user.id, kind: "AI_PROCESSING", version: CONSENT_VERSION, granted: true },
  });
  return { ok: true };
}

const localeSchema = z.enum(["en", "th"]).catch("en");

/** "Fill my profile by voice": transcript (or typed text) → Zod-validated draft for review. */
export async function structureProfile(
  transcript: unknown,
  locale: unknown,
): Promise<AiResult<ProfileDraft>> {
  const text = z.string().trim().min(1).max(8000).safeParse(transcript);
  if (!text.success) return { ok: false, error: "empty" };
  const user = await getCurrentUser();
  const gate = await aiGate(user?.id, "ai");
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { system, prompt } = structureProfilePrompt(text.data, localeSchema.parse(locale));
    const draft = await structured.generate({ schema: profileDraftSchema, system, prompt, maxTokens: 3000 });
    return { ok: true, data: cleanDraft(draft) };
  } catch (e) {
    log.error("ai.structure_failed", { kind: e instanceof Error ? e.name : "unknown" });
    return { ok: false, error: e instanceof AiOutputError ? "invalid" : "failed" };
  }
}

const bioInput = z.object({
  displayName: z.string().max(80).nullish(),
  headline: z.string().max(120).nullish(),
  bio: z.string().max(2000).nullish(),
  skills: z.array(z.string().max(60)).max(30).optional(),
  languages: z.array(z.string().max(40)).max(10).optional(),
  workMode: z.string().max(20).nullish(),
  availability: z.array(z.string().max(20)).max(4).optional(),
  specialTalents: z.string().max(500).nullish(),
  educations: z
    .array(
      z.object({
        level: z.string().max(30),
        school: z.string().max(120),
        field: z.string().max(120).nullish(),
        yearEnd: z.union([z.number(), z.string().max(4)]).nullish(),
      }),
    )
    .max(10)
    .optional(),
  notes: z.string().max(1000).nullish(),
});

/** "Write with AI": drafts a bio (or org description) from what the person has entered. */
export async function draftBio(input: unknown, locale: unknown): Promise<AiResult<{ bio: string }>> {
  const parsed = bioInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "empty" };
  const c = parsed.data;
  const hasFacts = Boolean(c.headline || c.bio || c.skills?.length || c.educations?.length || c.notes);
  if (!hasFacts) return { ok: false, error: "empty" };
  const user = await getCurrentUser();
  const gate = await aiGate(user?.id, "ai");
  if (!gate.ok) return { ok: false, error: gate.error };
  try {
    const { system, prompt } = bioPrompt(c, localeSchema.parse(locale));
    const out = await structured.generate({ schema: bioDraftSchema, system, prompt, maxTokens: 800 });
    const bio = out.bio.trim().slice(0, 2000);
    if (!bio) return { ok: false, error: "invalid" };
    return { ok: true, data: { bio } };
  } catch (e) {
    log.error("ai.bio_failed", { kind: e instanceof Error ? e.name : "unknown" });
    return { ok: false, error: e instanceof AiOutputError ? "invalid" : "failed" };
  }
}

/** Client asks once per page whether the person has AI consent (to show the inline prompt first). */
export async function aiConsentStatus(): Promise<{ signedIn: boolean; consent: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, consent: false };
  const last = await db.consentRecord.findFirst({
    where: { userId: user.id, kind: "AI_PROCESSING" },
    orderBy: { createdAt: "desc" },
    select: { granted: true },
  });
  return { signedIn: true, consent: Boolean(last?.granted) };
}
