import { z } from "zod";
import { availabilities, educationLevels, workModes } from "./talent";
import { thProvinces } from "@/config/th-provinces";

/**
 * What Claude may return for "Fill my profile by voice". Private fields (date of birth,
 * gender, work-setup needs, contact details) are deliberately absent: the model can never
 * fill them, even if the speaker mentions them (principles 3 and 6).
 */
export const profileDraftSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  province: z.string().nullable(),
  languages: z.array(z.string()),
  workMode: z.enum(workModes).nullable(),
  availability: z.array(z.enum(availabilities)),
  skills: z.array(z.string()),
  specialTalents: z.string().nullable(),
  educations: z.array(
    z.object({
      level: z.enum(educationLevels),
      school: z.string(),
      field: z.string().nullable(),
      yearEnd: z.number().int().nullable(),
    }),
  ),
});
export type ProfileDraft = z.infer<typeof profileDraftSchema>;

export const bioDraftSchema = z.object({ bio: z.string() });

/** Keys the review UI shows, in display order. */
export const draftKeys = [
  "firstName",
  "lastName",
  "displayName",
  "headline",
  "bio",
  "province",
  "languages",
  "workMode",
  "availability",
  "skills",
  "specialTalents",
  "educations",
] as const;
export type DraftKey = (typeof draftKeys)[number];

const clip = (s: string | null | undefined, max: number) => {
  const v = (s ?? "").replace(/\s+/g, " ").trim();
  return v ? v.slice(0, max) : null;
};
const clipBlock = (s: string | null | undefined, max: number) => {
  const v = (s ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return v ? v.slice(0, max) : null;
};
const uniq = (xs: string[], max: number, len: number) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const v = clip(x, len);
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
};

/** Normalizes a model draft to the app's field limits; only Thai provinces from the list survive. */
export function cleanDraft(d: ProfileDraft): ProfileDraft {
  const year = new Date().getFullYear() + 6;
  const province = d.province
    ? (thProvinces.find(
        (p) => p.en.toLowerCase() === d.province!.trim().toLowerCase() || p.th === d.province!.trim(),
      )?.en ?? null)
    : null;
  return {
    firstName: clip(d.firstName, 60),
    lastName: clip(d.lastName, 60),
    displayName: clip(d.displayName, 80),
    headline: clip(d.headline, 120),
    bio: clipBlock(d.bio, 2000),
    province,
    languages: uniq(d.languages, 10, 40),
    workMode: d.workMode,
    availability: [...new Set(d.availability)].slice(0, 4),
    skills: uniq(d.skills, 30, 60),
    specialTalents: clipBlock(d.specialTalents, 500),
    educations: d.educations
      .map((e) => ({
        level: e.level,
        school: clip(e.school, 120) ?? "",
        field: clip(e.field, 120),
        // Buddhist-era years (e.g. 2565) are converted to CE.
        yearEnd: e.yearEnd == null ? null : e.yearEnd > 2400 ? e.yearEnd - 543 : e.yearEnd,
      }))
      .filter((e) => e.school && (e.yearEnd == null || (e.yearEnd >= 1950 && e.yearEnd <= year)))
      .slice(0, 10),
  };
}

/** True when the draft has a value worth showing for this key. */
export function hasValue(d: ProfileDraft, k: DraftKey): boolean {
  const v = d[k];
  return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
}
