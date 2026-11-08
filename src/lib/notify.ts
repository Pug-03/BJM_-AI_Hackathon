import "server-only";
import { db } from "./db";
import { appUrl } from "./env";
import { sendMail } from "./email";
import { rateLimit } from "./rate-limit";
import { nudge, userTopic } from "./realtime";

export type NotifyKind =
  | "MESSAGE"
  | "OFFER"
  | "OFFER_ACCEPTED"
  | "OFFER_DECLINED"
  | "CALL"
  | "FOLLOW"
  | "STAR"
  | "REVIEW"
  | "COMMENT"
  | "LIKE"
  | "VERIFIED";

const COPY: Partial<Record<NotifyKind, { en: [string, string]; th: [string, string] }>> = {
  MESSAGE: {
    en: ["New message on ABLE", "{name} sent you a message."],
    th: ["ข้อความใหม่บน ABLE", "{name} ส่งข้อความถึงคุณ"],
  },
  OFFER: {
    en: ["You have a new offer on ABLE", "{name} sent you an offer."],
    th: ["คุณได้รับข้อเสนอใหม่บน ABLE", "{name} ส่งข้อเสนอถึงคุณ"],
  },
  OFFER_ACCEPTED: {
    en: ["Your offer was accepted", "{name} accepted your offer."],
    th: ["ข้อเสนอของคุณได้รับการยอมรับ", "{name} ยอมรับข้อเสนอของคุณ"],
  },
};

/**
 * In-app notification (always) + realtime nudge + optional email (section 9 Stage 9):
 * messages and offers only, respecting the person's email settings, and at most one
 * message email per 10 minutes so a chat doesn't flood the inbox. No message text in email.
 */
export async function notify(userId: string, kind: NotifyKind, payload: Record<string, unknown>) {
  await db.notification.create({ data: { userId, kind, payload: payload as object } });
  void nudge([userTopic(userId)]);
  const copy = COPY[kind];
  if (!copy) return;
  const [user, prefs] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, locale: true, isSandbox: true } }),
    db.notificationPrefs.findUnique({ where: { userId } }),
  ]);
  if (!user || user.isSandbox) return;
  const wants = kind === "MESSAGE" ? (prefs?.emailMessages ?? true) : (prefs?.emailOffers ?? true);
  if (!wants) return;
  if (kind === "MESSAGE" && !(await rateLimit(`mail:msg:${userId}`, 1, 600)).ok) return;
  const lang = user.locale === "th" ? "th" : "en";
  const [subject, line] = copy[lang];
  const name = String(payload.fromName ?? "ABLE");
  const link = `${appUrl()}/${lang}/messages/${String(payload.conversationId ?? "latest")}`;
  const settings = `${appUrl()}/${lang}/settings`;
  await sendMail({
    to: user.email,
    subject,
    text: `${line.replace("{name}", name)}\n\n${link}\n\n${lang === "th" ? "ปิดอีเมลเหล่านี้ได้ที่" : "Turn these emails off in"} ${settings}`,
  });
}
