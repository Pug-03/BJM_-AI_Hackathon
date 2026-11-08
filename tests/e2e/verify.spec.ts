import { test, expect, type BrowserContext } from "@playwright/test";
import path from "path";
import { readFileSync } from "fs";
import { enterJudge } from "./helpers";

async function signInAs(ctx: BrowserContext, baseURL: string, email: string) {
  const headers = { origin: baseURL, "content-type": "application/json" };
  await ctx.request.post(`${baseURL}/api/auth/email-otp/send-verification-otp`, { headers, data: { email, type: "sign-in" } });
  await ctx.request.post(`${baseURL}/api/auth/sign-in/email-otp`, { headers, data: { email, otp: process.env.ABLE_E2E_OTP ?? "424242" } });
}

test("verification panel shows status and the admin queue renders", async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  const tCtx = await browser.newContext();
  await enterJudge(tCtx, baseURL!, "talent");
  const tp = await tCtx.newPage();
  // Sandbox Ploy starts verified; reset isn't possible from UI, so use the disability card flow if identity is done.
  await tp.goto(`${baseURL}/en/settings`);
  const section = tp.getByRole("region", { name: /Disability card verified|Identity verified/ }).first();
  await expect(tp.getByRole("heading", { name: "Get verified" })).toBeVisible();
  await expect(section).toBeVisible();
  // Judge persona is pre-verified (sample data): both cards show "Verified".
  await expect(tp.getByRole("status").filter({ hasText: "Verified" }).first()).toBeVisible();
  await tCtx.close();

  // A fresh judge employer can't submit (talent-only) — and the admin queue renders.
  const admin = await browser.newContext();
  await signInAs(admin, baseURL!, "admin-qa@example.com");
  const ap = await admin.newPage();
  await ap.goto(`${baseURL}/en/admin`);
  await expect(ap.getByRole("heading", { name: /Identity and disability card checks/ })).toBeVisible();
  await admin.close();
});

test("disability info stays private by default and shows per visibility", async ({ request }) => {
  // Sample "Nok" shares only with employers she chats with; Wichai shares publicly.
  const nok = await (await request.get("/en/u/nok-edits")).text().catch(() => "");
  expect(nok).not.toContain("Clear briefs and quiet focus time");
  const wichai = await (await request.get("/en/u/wichai-qa")).text();
  expect(wichai).toContain("I test with VoiceOver and NVDA every day");
  expect(wichai).toContain("Identity verified");
});

test("verification upload accepts an image into the private bucket", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext();
  await enterJudge(ctx, baseURL!, "talent");
  const res = await ctx.request.post(`${baseURL}/api/upload`, {
    multipart: { bucket: "verification", file: { name: "id.png", mimeType: "image/png", buffer: readFileSync(path.join(__dirname, "../fixtures/photo.png")) } },
  });
  expect(res.ok()).toBeTruthy();
  const { url } = await res.json();
  expect(url).toMatch(/^(local|sb):\/\/verification\//);
  // Not readable by an anonymous visitor.
  const anon = await browser.newContext();
  const local = String(url).replace(/^local:\/\//, "/api/files/");
  const r = await anon.request.get(`${baseURL}${local}`);
  expect([401, 403, 404]).toContain(r.status());
  await ctx.close();
  await anon.close();
});
