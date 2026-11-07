import "server-only";
import { Resend } from "resend";
import { log } from "./log";

const from = () => process.env.EMAIL_FROM ?? "ABLE <no-reply@able.example>";

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Sends with Resend; without a key in development, prints to the server console. */
export async function sendMail(input: MailInput): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `\n[ABLE mail — dev, not sent]\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.text}\n`,
      );
    } else {
      log.warn("mail.skipped", { reason: "RESEND_API_KEY missing" });
    }
    return { delivered: false };
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: from(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  if (error) {
    log.error("mail.failed", { name: error.name });
    return { delivered: false };
  }
  return { delivered: true };
}

export function otpEmail(otp: string, locale: string): MailInput & { to: "" } {
  const th = locale === "th";
  const subject = th ? `รหัสเข้าสู่ระบบ ABLE: ${otp}` : `Your ABLE sign-in code: ${otp}`;
  const text = th
    ? `รหัสเข้าสู่ระบบ ABLE ของคุณคือ ${otp}\n\nรหัสนี้ใช้ได้ 10 นาที หากคุณไม่ได้ขอรหัสนี้ ไม่ต้องทำอะไร`
    : `Your ABLE sign-in code is ${otp}\n\nIt expires in 10 minutes. If you didn’t ask for this, you can ignore this email.`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:32px;color:#17151C">
<p style="font-size:20px;font-weight:600;margin:0 0 16px">ABLE</p>
<p style="margin:0 0 16px">${th ? "รหัสเข้าสู่ระบบของคุณ" : "Your sign-in code"}</p>
<p style="font-size:32px;letter-spacing:8px;font-weight:600;margin:0 0 16px">${otp}</p>
<p style="color:#5C5866;margin:0">${th ? "ใช้ได้ 10 นาที หากคุณไม่ได้ขอรหัสนี้ ไม่ต้องทำอะไร" : "It expires in 10 minutes. If you didn’t ask for this, you can ignore this email."}</p></div>`;
  return { to: "", subject, text, html };
}
