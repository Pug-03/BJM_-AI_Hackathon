import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { lexicalSimilarity, scoreMatch, type Mode, type NeedFacts, type TalentFacts } from "./match";
import { ageFromDob } from "./utils";

/**
 * DB side of matching. Takes the Prisma client as a parameter so the seed script and the
 * app share it. `embed` is optional: without an OpenAI key (or without pgvector) similarity
 * falls back to the lexical measure in `match.ts`.
 */
export type EmbedFn = (texts: string[]) => Promise<number[][]>;

const talentInclude = {
  skills: { select: { name: true } },
  educations: { select: { level: true, school: true, field: true } },
  _count: { select: { certificates: true, portfolio: true, educations: true } },
} as const;

type TalentRow = Awaited<ReturnType<typeof loadTalent>>;
async function loadTalent(db: PrismaClient, where: { id: string }) {
  return db.talentProfile.findUnique({ where, include: talentInclude });
}

/** Public profile text only — never DOB, gender, work-setup or contacts. */
export function talentText(t: NonNullable<TalentRow>) {
  return [
    t.headline,
    t.bio,
    `Skills: ${t.skills.map((s) => s.name).join(", ")}`,
    t.educations.map((e) => [e.level, e.field, e.school].filter(Boolean).join(" ")).join("; "),
    t.specialTalents,
    `Languages: ${t.languages.join(", ")}`,
    `Work: ${t.workMode} ${t.availability.join(" ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function needText(n: {
  title: string;
  skills: string[];
  description: string | null;
  educationLevel: string | null;
  workMode: string;
  employmentType: string;
}) {
  return [
    n.title,
    n.description,
    `Skills: ${n.skills.join(", ")}`,
    n.educationLevel,
    `Work: ${n.workMode} ${n.employmentType}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function facts(t: NonNullable<TalentRow>): TalentFacts {
  return {
    skills: t.skills.map((s) => s.name),
    workMode: t.workMode as Mode,
    province: t.province,
    hasPhoto: Boolean(t.avatarUrl),
    headline: t.headline,
    bio: t.bio,
    educationCount: t._count.educations,
    proofCount: t._count.certificates + t._count.portfolio,
    shownAge: t.showAge && t.dob ? ageFromDob(t.dob) : null,
  };
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);

let vectorSupport: Promise<boolean> | null = null;
/** True when the database has pgvector `embedding` columns (Supabase); false on the local fallback schema. */
export function hasVectors(db: PrismaClient) {
  vectorSupport ??= db
    .$queryRawUnsafe<{ ok: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'TalentProfile' AND column_name = 'embedding') AS ok`,
    )
    .then((r) => Boolean(r[0]?.ok))
    .catch(() => false);
  return vectorSupport;
}

async function ensureEmbedding(
  db: PrismaClient,
  table: "TalentProfile" | "HiringNeed",
  id: string,
  text: string,
  currentHash: string | null,
  embed?: EmbedFn,
) {
  const h = hash(text);
  if (!embed || h === currentHash || !(await hasVectors(db))) return currentHash === h;
  const [v] = await embed([text]);
  if (!v) return false;
  await db.$executeRawUnsafe(
    `UPDATE "${table}" SET embedding = $1::vector, "embeddingHash" = $2 WHERE id = $3`,
    `[${v.join(",")}]`,
    h,
    id,
  );
  return true;
}

/** Vector similarity for one need against many talent (pgvector cosine). */
async function vectorSims(db: PrismaClient, needId: string, talentIds: string[]) {
  if (!talentIds.length || !(await hasVectors(db))) return new Map<string, number>();
  const rows = await db.$queryRawUnsafe<{ id: string; sim: number }[]>(
    `SELECT t.id, 1 - (t.embedding <=> n.embedding) AS sim
       FROM "TalentProfile" t, "HiringNeed" n
      WHERE n.id = $1 AND n.embedding IS NOT NULL AND t.embedding IS NOT NULL AND t.id = ANY($2::text[])`,
    needId,
    talentIds,
  );
  return new Map(rows.map((r) => [r.id, Number(r.sim)]));
}

async function upsertScore(
  db: PrismaClient,
  needId: string,
  talentId: string,
  r: ReturnType<typeof scoreMatch>,
) {
  const prev = await db.matchScore.findUnique({
    where: { needId_talentId: { needId, talentId } },
    select: { parts: true },
  });
  const prevMatched = JSON.stringify((prev?.parts as { matched?: string[] } | null)?.matched ?? null);
  // The "Why this match" line is regenerated only when what it cites changed.
  const stale = prevMatched !== JSON.stringify(r.parts.matched);
  await db.matchScore.upsert({
    where: { needId_talentId: { needId, talentId } },
    create: { needId, talentId, score: r.score, parts: r.parts as object },
    update: {
      score: r.score,
      parts: r.parts as object,
      ...(stale ? { reason: null, reasonLang: null } : {}),
    },
  });
}

/** Recompute every candidate for one hiring need. Candidates: public, non-sandbox talent. */
export async function recomputeNeed(db: PrismaClient, needId: string, embed?: EmbedFn) {
  const need = await db.hiringNeed.findUnique({ where: { id: needId } });
  if (!need) return 0;
  const nText = needText(need);
  const needVec = await ensureEmbedding(db, "HiringNeed", need.id, nText, need.embeddingHash, embed);
  const talents = await db.talentProfile.findMany({
    where: { isPublic: true, user: { isSandbox: false } },
    include: talentInclude,
  });
  const sims = needVec
    ? await vectorSims(
        db,
        need.id,
        talents.map((t) => t.id),
      )
    : new Map<string, number>();
  const nf: NeedFacts = {
    skills: need.skills,
    workMode: need.workMode as Mode,
    location: need.location,
    ageMin: need.ageMin,
    ageMax: need.ageMax,
  };
  for (const t of talents) {
    const v = sims.get(t.id);
    const r = scoreMatch(
      facts(t),
      nf,
      v ?? lexicalSimilarity(talentText(t), nText),
      v == null ? "lexical" : "vector",
    );
    await upsertScore(db, need.id, t.id, r);
  }
  return talents.length;
}

/** Recompute one talent against every open need (after a profile change). */
export async function recomputeTalent(db: PrismaClient, talentId: string, embed?: EmbedFn) {
  const t = await loadTalent(db, { id: talentId });
  if (!t) return 0;
  const user = await db.user.findUnique({ where: { id: t.userId }, select: { isSandbox: true } });
  if (!t.isPublic) {
    await db.matchScore.deleteMany({ where: { talentId } });
    return 0;
  }
  const tText = talentText(t);
  const tVec = await ensureEmbedding(db, "TalentProfile", t.id, tText, t.embeddingHash, embed);
  // Judge-sandbox talent are scored only against sample organizations (their own feed);
  // employer feeds never show sandbox talent.
  const needs = await db.hiringNeed.findMany({
    where: {
      isOpen: true,
      ...(user?.isSandbox ? { org: { isSample: true, user: { isSandbox: false } } } : {}),
    },
  });
  const f = facts(t);
  for (const n of needs) {
    const sims = tVec ? await vectorSims(db, n.id, [t.id]) : new Map<string, number>();
    const v = sims.get(t.id);
    const r = scoreMatch(
      f,
      {
        skills: n.skills,
        workMode: n.workMode as Mode,
        location: n.location,
        ageMin: n.ageMin,
        ageMax: n.ageMax,
      },
      v ?? lexicalSimilarity(tText, needText(n)),
      v == null ? "lexical" : "vector",
    );
    await upsertScore(db, n.id, t.id, r);
  }
  return needs.length;
}
