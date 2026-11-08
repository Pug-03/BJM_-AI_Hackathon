import { z } from "zod";
import { availabilities, contactSchema, educationLevels, handleSchema, workModes } from "./talent";

export const orgTypes = ["INDIVIDUAL", "ASSOCIATION", "STARTUP", "PRIVATE_COMPANY", "GOVERNMENT"] as const;
/** "Accessible workplace setup we can offer" (section 7.5). */
export const setupOptions = [
  "REMOTE",
  "FLEXIBLE_HOURS",
  "SCREEN_READER",
  "STEP_FREE",
  "SIGN_LANGUAGE",
  "OTHER",
] as const;

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const orgBasicsSchema = z.object({
  type: z.enum(orgTypes),
  name: z.string().trim().min(1).max(120),
  handle: handleSchema,
  country: z.string().length(2).toUpperCase(),
  province: optText(80),
  website: z
    .string()
    .trim()
    .max(300)
    .url()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  employeeCount: z.number().int().min(1).max(10_000_000).nullable().optional(),
  currentHires: z.number().int().min(0).max(10_000_000).nullable().optional(),
  /** Private — used for verification only, never shown publicly. */
  registrationNo: optText(40),
});

export const orgAboutSchema = z.object({
  description: optText(2000),
  industry: optText(80),
  contacts: z.array(contactSchema).max(8),
});

export const needSchema = z
  .object({
    id: z.string().max(40).optional(),
    title: z.string().trim().min(1).max(120),
    skills: z.array(z.string().trim().min(1).max(60)).max(20),
    workMode: z.enum(workModes),
    location: optText(80),
    employmentType: z.enum(availabilities),
    educationLevel: z.enum(educationLevels).nullable().optional(),
    // Soft preference only (principle 4): reorders among talent who show age, never filters.
    ageMin: z.number().int().min(15).max(99).nullable().optional(),
    ageMax: z.number().int().min(15).max(99).nullable().optional(),
    offeredSetup: z.array(z.enum(setupOptions)).max(setupOptions.length),
    description: optText(2000),
  })
  .refine((n) => n.ageMin == null || n.ageMax == null || n.ageMin <= n.ageMax, {
    message: "age_range",
    path: ["ageMax"],
  });
export type NeedInput = z.infer<typeof needSchema>;
