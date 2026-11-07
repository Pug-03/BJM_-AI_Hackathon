import { z } from "zod";

/** Shared Zod schemas for talent profile data (forms, server actions, AI output). */

export const workModes = ["REMOTE", "ONSITE", "HYBRID", "ANY"] as const;
export const availabilities = ["FULL_TIME", "PART_TIME", "FREELANCE", "PROJECT"] as const;
export const contactKinds = [
  "PHONE",
  "EMAIL",
  "LINE",
  "INSTAGRAM",
  "TIKTOK",
  "FACEBOOK",
  "LINKEDIN",
  "WEBSITE",
] as const;
export const visibilities = ["PUBLIC", "CHAT_ONLY", "HIDDEN"] as const;
export const certKinds = ["EMPLOYMENT", "TRAINING", "OTHER"] as const;
export const educationLevels = [
  "PRIMARY",
  "SECONDARY",
  "VOCATIONAL",
  "VOCATIONAL_HIGH",
  "BACHELOR",
  "MASTER",
  "DOCTORATE",
  "OTHER",
] as const;

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "handle_format");

export const basicsSchema = z.object({
  firstName: text(60).min(1),
  lastName: text(60).min(1),
  displayName: text(80).min(1),
  handle: handleSchema,
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional()
    .refine((v) => !v || (new Date(v) < new Date() && new Date(v) > new Date("1900-01-01")), "dob_range"),
  showAge: z.boolean().optional(),
  gender: z.enum(["FEMALE", "MALE", "NON_BINARY", "SELF_DESCRIBE", "PREFER_NOT"]).nullable().optional(),
  country: z.string().length(2).toUpperCase(),
  province: optText(80),
});

export const aboutSchema = z.object({
  headline: optText(120),
  bio: optText(2000),
  languages: z.array(text(40).min(1)).max(10),
  workMode: z.enum(workModes),
  availability: z.array(z.enum(availabilities)).max(4),
});

export const educationSchema = z.object({
  id: z.string().optional(),
  level: z.enum(educationLevels),
  school: text(120).min(1),
  field: optText(120),
  yearEnd: z.number().int().min(1950).max(2100).nullable().optional(),
});

export const skillsSchema = z.object({
  skills: z.array(text(60).min(1)).max(30),
  specialTalents: optText(500),
  educations: z.array(educationSchema).max(10),
});

export const certificateSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(certKinds),
  title: text(140).min(1),
  issuer: optText(140),
  issuedAt: z
    .string()
    .regex(/^\d{4}-\d{2}(-\d{2})?$/)
    .nullable()
    .optional(),
  fileUrl: z.string().min(1).max(500),
  isPublic: z.boolean().default(true),
});

export const portfolioSchema = z.object({
  id: z.string().optional(),
  title: text(120).min(1),
  description: optText(1000),
  images: z.array(z.string().max(500)).max(10),
  imageAlts: z.array(text(200)).max(10),
  link: z
    .string()
    .trim()
    .url()
    .max(300)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export const contactSchema = z.object({
  kind: z.enum(contactKinds),
  value: text(200).min(1),
  visibility: z.enum(visibilities),
});

export const privacySchema = z.object({
  contacts: z.array(contactSchema).max(contactKinds.length),
  workSetupNeeds: optText(500),
  isPublic: z.boolean(),
  consentAi: z.boolean(),
  consentWorkSetup: z.boolean(),
});

export const postSchema = z.object({
  kind: z.enum(["WORK", "PHOTO"]),
  text: optText(3000),
  images: z.array(z.string().max(500)).max(10),
  imageAlts: z.array(text(200)).max(10),
});

/**
 * Filter keys allowed anywhere (explore, feed). Disability, gender, religion and
 * ethnicity are deliberately absent — and `.strict()` rejects them (principle 1).
 */
export const talentFilterSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    skills: z.array(z.string().trim().max(60)).max(10).optional(),
    location: z.string().trim().max(80).optional(),
    workMode: z.enum(workModes).optional(),
    availability: z.enum(availabilities).optional(),
    educationLevel: z.enum(educationLevels).optional(),
    hasCertificates: z.boolean().optional(),
    minRating: z.number().min(0).max(5).optional(),
    cursor: z.string().max(100).optional(),
  })
  .strict();
export type TalentFilter = z.infer<typeof talentFilterSchema>;

export function suggestHandle(first: string, last: string): string {
  const base = `${first}-${last}`
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : `talent-${Math.random().toString(36).slice(2, 8)}`;
}
