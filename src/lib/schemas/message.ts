import { z } from "zod";

/** Strips control characters (keeps newlines/tabs). Text is always rendered as text, never HTML. */
export const cleanText = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

export const attachmentSchema = z.object({
  url: z.string().regex(/^(sb|local):\/\/chat\/[\w./-]+$/, "chat_ref"),
  type: z.string().max(60),
  name: z.string().max(120).optional(),
  size: z
    .number()
    .int()
    .min(0)
    .max(25 * 1024 * 1024)
    .optional(),
  durationMs: z
    .number()
    .int()
    .min(0)
    .max(10 * 60 * 1000)
    .optional(),
  alt: z.string().max(200).optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const currencies = ["THB", "USD", "EUR", "SGD", "JPY"] as const;
export const payPeriods = ["HOUR", "DAY", "MONTH", "PROJECT"] as const;

/** "Send offer" card (section 7.8) — a message, not a contract. Same terms for everyone. */
export const offerSchema = z.object({
  role: z.string().trim().min(1).max(120),
  pay: z.number().positive().max(100_000_000),
  currency: z.enum(currencies),
  period: z.enum(payPeriods),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type OfferInput = z.infer<typeof offerSchema>;

export const sendSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("TEXT"),
    text: z.string().max(4000).transform(cleanText).pipe(z.string().min(1)),
  }),
  z.object({
    kind: z.literal("IMAGE"),
    text: z.string().max(4000).transform(cleanText).optional(),
    attachments: z.array(attachmentSchema).min(1).max(10),
  }),
  z.object({ kind: z.literal("FILE"), attachments: z.array(attachmentSchema).min(1).max(5) }),
  z.object({ kind: z.literal("VOICE_NOTE"), attachments: z.array(attachmentSchema).length(1) }),
  z.object({ kind: z.literal("OFFER"), offer: offerSchema, counterOf: z.string().max(40).optional() }),
]);
export type SendInput = z.input<typeof sendSchema>;

export const reportReasons = ["SPAM", "SCAM", "HARASSMENT", "DISCRIMINATION", "FAKE", "OTHER"] as const;
