import type { BrowserContext } from "@playwright/test";

/** Signs a context in as a brand-new user via the email OTP API (needs ABLE_E2E_OTP on the server). */
export async function signInFresh(ctx: BrowserContext, baseURL: string, prefix = "qa"): Promise<string> {
  const otp = process.env.ABLE_E2E_OTP ?? "424242";
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const headers = { origin: baseURL, "content-type": "application/json" };
  const send = await ctx.request.post(`${baseURL}/api/auth/email-otp/send-verification-otp`, {
    headers,
    data: { email, type: "sign-in" },
  });
  if (!send.ok()) throw new Error(`send OTP failed: ${send.status()}`);
  const res = await ctx.request.post(`${baseURL}/api/auth/sign-in/email-otp`, {
    headers,
    data: { email, otp },
  });
  if (!res.ok()) throw new Error(`sign-in failed: ${res.status()}`);
  return email;
}
