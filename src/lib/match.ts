/**
 * Matching (section 7.7) — pure functions, unit-tested.
 * score = 0.55 × text similarity + 0.25 × skill overlap (Jaccard) + 0.10 × work-mode/location fit
 *       + 0.10 × profile completeness.
 * Disability, gender, religion and ethnicity are never inputs. Age preference only nudges the
 * order among talent who chose to show their age; it never removes anyone.
 */

export const WEIGHTS = { similarity: 0.55, skills: 0.25, fit: 0.1, completeness: 0.1 } as const;

export type Mode = "REMOTE" | "ONSITE" | "HYBRID" | "ANY";

export interface TalentFacts {
  skills: string[];
  workMode: Mode;
  province: string | null;
  hasPhoto: boolean;
  headline: string | null;
  bio: string | null;
  educationCount: number;
  proofCount: number;
  /** Only set when the talent turned on "Show my age". */
  shownAge: number | null;
}

export interface NeedFacts {
  skills: string[];
  workMode: Mode;
  location: string | null;
  ageMin: number | null;
  ageMax: number | null;
}

export interface MatchParts {
  similarity: number;
  skills: number;
  fit: number;
  completeness: number;
  raw: number;
  matched: string[];
  agePenalty: number;
  method: "vector" | "lexical";
}

export const normSkill = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .trim();

function sameSkill(a: string, b: string) {
  if (a === b) return true;
  // "excel" ↔ "microsoft excel", "live chat" ↔ "live chat support" (whole words only)
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.length >= 3 && ` ${long} `.includes(` ${short} `);
}

/** Need skills the talent has (need's wording). */
export function matchedSkills(talent: string[], need: string[]): string[] {
  const t = talent.map(normSkill).filter(Boolean);
  return need.filter((n) => {
    const nn = normSkill(n);
    return nn && t.some((x) => sameSkill(x, nn));
  });
}

/** Jaccard overlap with fuzzy whole-word matching. */
export function skillOverlap(talent: string[], need: string[]): number {
  const t = [...new Set(talent.map(normSkill).filter(Boolean))];
  const n = [...new Set(need.map(normSkill).filter(Boolean))];
  if (!t.length || !n.length) return 0;
  const inter = n.filter((x) => t.some((y) => sameSkill(x, y))).length;
  return inter / (t.length + n.length - inter);
}

export function workFit(
  t: Pick<TalentFacts, "workMode" | "province">,
  n: Pick<NeedFacts, "workMode" | "location">,
) {
  const sameArea =
    !n.location || !t.province ? 0.6 : normSkill(n.location) === normSkill(t.province) ? 1 : 0.3;
  if (n.workMode === "ANY" || t.workMode === "ANY") return n.workMode === "ONSITE" ? sameArea : 1;
  if (n.workMode === "REMOTE") return t.workMode === "ONSITE" ? 0.6 : 1;
  if (n.workMode === "HYBRID") return (t.workMode === "REMOTE" ? 0.6 : 1) * (0.5 + 0.5 * sameArea);
  // ONSITE
  return (t.workMode === "REMOTE" ? 0.3 : 1) * sameArea;
}

export function completeness(t: TalentFacts) {
  const checks = [
    t.hasPhoto,
    Boolean(t.headline),
    Boolean(t.bio),
    t.skills.length >= 3,
    t.educationCount > 0,
    t.proofCount > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/** Soft age signal: a small nudge in sort order, only for talent who show their age. */
export function agePenalty(t: Pick<TalentFacts, "shownAge">, n: Pick<NeedFacts, "ageMin" | "ageMax">) {
  if (t.shownAge == null || (n.ageMin == null && n.ageMax == null)) return 0;
  const out = (n.ageMin != null && t.shownAge < n.ageMin) || (n.ageMax != null && t.shownAge > n.ageMax);
  return out ? 0.05 : 0;
}

export function scoreMatch(
  t: TalentFacts,
  n: NeedFacts,
  similarity: number,
  method: MatchParts["method"],
): { score: number; parts: MatchParts } {
  const sim = Math.max(0, Math.min(1, similarity));
  const skills = skillOverlap(t.skills, n.skills);
  const fit = workFit(t, n);
  const comp = completeness(t);
  const raw =
    WEIGHTS.similarity * sim + WEIGHTS.skills * skills + WEIGHTS.fit * fit + WEIGHTS.completeness * comp;
  const pen = agePenalty(t, n);
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    score: r(raw - pen),
    parts: {
      similarity: r(sim),
      skills: r(skills),
      fit: r(fit),
      completeness: r(comp),
      raw: r(raw),
      matched: matchedSkills(t.skills, n.skills),
      agePenalty: pen,
      method,
    },
  };
}

/**
 * Language-agnostic text similarity used when embeddings are unavailable (no OpenAI key or
 * no pgvector): cosine over character trigrams, which works for Thai (no spaces) and English.
 */
export function lexicalSimilarity(a: string, b: string): number {
  const grams = (s: string) => {
    const m = new Map<string, number>();
    const x = ` ${s.toLowerCase().normalize("NFKC").replace(/\s+/g, " ")} `;
    for (let i = 0; i < x.length - 2; i++) {
      const g = x.slice(i, i + 3);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = grams(a);
  const B = grams(b);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [g, v] of A) {
    na += v * v;
    dot += v * (B.get(g) ?? 0);
  }
  for (const v of B.values()) nb += v * v;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
