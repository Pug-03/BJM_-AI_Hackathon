import "server-only";
import type { Prisma } from "@prisma/client";
import type { TalentFilter } from "./schemas/talent";

/**
 * Prisma filter for talent search (explore + feed). Built only from `talentFilterSchema`,
 * which has no disability, gender, religion, ethnicity or age keys (principle 1).
 */
export function talentWhere(f: TalentFilter): Prisma.TalentProfileWhereInput {
  const and: Prisma.TalentProfileWhereInput[] = [{ isPublic: true }, { user: { isSandbox: false } }];
  if (f.q)
    and.push({
      OR: [
        { displayName: { contains: f.q, mode: "insensitive" } },
        { headline: { contains: f.q, mode: "insensitive" } },
        { bio: { contains: f.q, mode: "insensitive" } },
        { skills: { some: { name: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  for (const s of f.skills ?? [])
    and.push({ skills: { some: { name: { contains: s, mode: "insensitive" } } } });
  if (f.location)
    and.push({
      OR: [
        { province: { contains: f.location, mode: "insensitive" } },
        { country: { equals: f.location.toUpperCase() } },
      ],
    });
  if (f.workMode) and.push({ workMode: { in: f.workMode === "ANY" ? ["ANY"] : [f.workMode, "ANY"] } });
  if (f.availability) and.push({ availability: { has: f.availability } });
  if (f.educationLevel) and.push({ educations: { some: { level: f.educationLevel } } });
  if (f.hasCertificates) and.push({ certificates: { some: { isPublic: true } } });
  if (f.minRating) and.push({ ratingAvg: { gte: f.minRating } });
  return { AND: and };
}

export const talentCardSelect = {
  id: true,
  userId: true,
  handle: true,
  displayName: true,
  headline: true,
  avatarUrl: true,
  coverUrl: true,
  province: true,
  country: true,
  workMode: true,
  availability: true,
  verifyTier: true,
  ratingAvg: true,
  ratingCount: true,
  isSample: true,
  skills: { select: { name: true }, take: 12 },
} satisfies Prisma.TalentProfileSelect;

export type TalentCardRow = Prisma.TalentProfileGetPayload<{ select: typeof talentCardSelect }>;

export interface TalentCard {
  talentId: string;
  userId: string;
  handle: string;
  name: string;
  headline: string | null;
  avatar: string | null;
  cover: string | null;
  province: string | null;
  country: string;
  workMode: string;
  availability: string[];
  verifyTier: number;
  rating: number;
  ratingCount: number;
  sample: boolean;
  skills: string[];
}

export function toCard(t: TalentCardRow): TalentCard {
  return {
    talentId: t.id,
    userId: t.userId,
    handle: t.handle,
    name: t.displayName,
    headline: t.headline,
    avatar: t.avatarUrl,
    cover: t.coverUrl,
    province: t.province,
    country: t.country,
    workMode: t.workMode,
    availability: t.availability,
    verifyTier: t.verifyTier,
    rating: t.ratingAvg,
    ratingCount: t.ratingCount,
    sample: t.isSample,
    skills: t.skills.map((s) => s.name),
  };
}
