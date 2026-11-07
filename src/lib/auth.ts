import "server-only";
import { createHash } from "crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { otpEmail, sendMail } from "./email";
import { rateLimit, limits } from "./rate-limit";
import { CONSENT_VERSION } from "./consent";
import { log } from "./log";

const e2e = Boolean(process.env.ABLE_E2E_OTP && !process.env.VERCEL);
// Must be identical in every server bundle (route handlers, server actions), so it is derived,
// not random. The database URL contains the DB password, so outsiders cannot reproduce it.
const fallbackSecret = createHash("sha256")
  .update(`able-fallback-secret:${process.env.DATABASE_URL ?? "no-db"}`)
  .digest("base64");

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account" as const,
        },
      }
    : undefined;

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

function localeFrom(headers?: Headers | null): string {
  const cookie = headers?.get("cookie") ?? "";
  const m = cookie.match(/NEXT_LOCALE=(en|th)/);
  return m?.[1] ?? "en";
}

export const auth = betterAuth({
  appName: "ABLE",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  // Without BETTER_AUTH_SECRET the app still boots (never white-screens) with a derived secret.
  // Production deployments must set the variable.
  secret: process.env.BETTER_AUTH_SECRET ?? fallbackSecret,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: false },
  socialProviders: google,
  account: { accountLinking: { enabled: true, trustedProviders: ["google", "email-otp"] } },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, input: false },
      locale: { type: "string", required: false, defaultValue: "en", input: false },
      isSandbox: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    database: { generateId: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      // Relaxed only for the E2E suite (many sign-ins from one IP); see ABLE_E2E_OTP.
      "/email-otp/send-verification-otp": { window: 60, max: e2e ? 200 : 6 },
      "/sign-in/email-otp": { window: 60, max: e2e ? 200 : 10 },
      "/sign-in/social": { window: 60, max: 10 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isAdmin = adminEmails().includes(user.email.toLowerCase());
          return { data: { ...user, role: isAdmin ? "ADMIN" : null } };
        },
        after: async (user) => {
          // Accepting Terms & Privacy is the condition of creating an account ("By continuing, you agree…").
          await db.consentRecord.create({
            data: { userId: user.id, kind: "TERMS_PRIVACY", version: CONSENT_VERSION, granted: true },
          });
          await db.auditLog.create({ data: { actorUserId: user.id, action: "account.created", meta: {} } });
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      storeOTP: "hashed",
      // E2E only: a fixed code so Playwright can sign in. Ignored on Vercel and unless ABLE_E2E_OTP is set.
      generateOTP: () =>
        process.env.ABLE_E2E_OTP && !process.env.VERCEL ? process.env.ABLE_E2E_OTP : undefined,
      async sendVerificationOTP({ email, otp }, ctx) {
        const rl = await rateLimit(
          `otp:${email.toLowerCase()}`,
          limits.otpPerEmail.max,
          limits.otpPerEmail.windowSec,
        );
        if (!rl.ok) {
          log.warn("otp.rate_limited", { retryAfter: rl.retryAfter });
          throw new Error("RATE_LIMITED");
        }
        const mail = otpEmail(otp, localeFrom(ctx?.request?.headers ?? ctx?.headers));
        await sendMail({ ...mail, to: email });
        if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
          console.info(`[ABLE] Sign-in code (dev): ${otp}`);
        }
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
