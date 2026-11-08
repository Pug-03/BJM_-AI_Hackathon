import { test, expect, type BrowserContext } from "@playwright/test";
import { enterJudge } from "./helpers";

async function signInAs(ctx: BrowserContext, baseURL: string, email: string) {
  const headers = { origin: baseURL, "content-type": "application/json" };
  await ctx.request.post(`${baseURL}/api/auth/email-otp/send-verification-otp`, { headers, data: { email, type: "sign-in" } });
  const r = await ctx.request.post(`${baseURL}/api/auth/sign-in/email-otp`, { headers, data: { email, otp: process.env.ABLE_E2E_OTP ?? "424242" } });
  expect(r.ok()).toBeTruthy();
}

test.describe("social and trust", () => {
  test("offer accepted → employer reviews the talent; talent is notified", async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const tCtx = await browser.newContext();
    const eCtx = await browser.newContext();
    await enterJudge(tCtx, baseURL!, "talent");
    await enterJudge(eCtx, baseURL!, "employer");
    const tp = await tCtx.newPage();
    await tp.goto(`${baseURL}/en/me`);
    const handle = ((await tp.getByText(/^@[a-z0-9-]+ ·/).first().textContent()) ?? "").match(/^@([a-z0-9-]+)/)![1];

    // Employer sends an offer
    const ep = await eCtx.newPage();
    await ep.goto(`${baseURL}/en/u/${handle}`);
    await ep.getByRole("button", { name: "Message" }).first().click();
    await ep.waitForURL(/\/messages\/.+/);
    await ep.getByRole("button", { name: "Add photo, file or offer" }).click();
    await ep.getByRole("menuitem", { name: "Send offer" }).click();
    const dlg = ep.getByRole("dialog", { name: "Send an offer" });
    await dlg.getByRole("textbox", { name: "Role" }).fill("QA analyst");
    await dlg.getByRole("textbox", { name: "Pay" }).fill("30000");
    await dlg.getByRole("button", { name: "Send offer" }).click();
    await expect(ep.getByRole("log").getByText("QA analyst")).toBeVisible();

    // Talent accepts
    await tp.goto(`${baseURL}/en/messages/latest`);
    const offer = tp.getByRole("article", { name: "Offer" }).last();
    await offer.getByRole("button", { name: "Accept" }).click();
    await expect(offer.getByText("Accepted")).toBeVisible();

    // Employer can now review, once
    await ep.goto(`${baseURL}/en/u/${handle}`);
    await ep.getByRole("tab", { name: /Reviews/ }).click();
    const form = ep.getByRole("heading", { name: /Review your work with/ });
    await expect(form).toBeVisible();
    await ep.getByRole("radio", { name: "5 stars" }).check({ force: true });
    await ep.getByLabel(/What was it like/).fill("Clear, careful and quick.");
    await ep.getByRole("button", { name: "Post review" }).click();
    await expect(ep.getByText("Clear, careful and quick.")).toBeVisible({ timeout: 15_000 });
    await expect(form).toHaveCount(0);

    await tp.goto(`${baseURL}/en/notifications`);
    await expect(tp.getByText(/left you a review/).first()).toBeVisible();
    await tCtx.close();
    await eCtx.close();
  });

  test("like and comment on a post", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext();
    await enterJudge(ctx, baseURL!, "employer");
    const p = await ctx.newPage();
    await p.goto(`${baseURL}/en/u/kittipong-design`);
    const like = p.getByRole("button", { name: /like/i }).first();
    const before = await like.getAttribute("aria-pressed");
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
    await p.getByRole("button", { name: /comment/i }).first().click();
    const text = `Lovely work ${Date.now()}`;
    await p.getByRole("textbox", { name: "Write a comment" }).first().fill(text);
    await p.getByRole("button", { name: "Post", exact: true }).first().click();
    await expect(p.getByText(text)).toBeVisible();
    await ctx.close();
  });

  test("admin page is hidden from everyone but admins", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext();
    await enterJudge(ctx, baseURL!, "talent");
    const p = await ctx.newPage();
    await p.goto(`${baseURL}/en/admin`);
    // With route-level loading UI the status streams as 200; the not-found page is what matters.
    await expect(p.getByRole("heading", { level: 1, name: "We can’t find that page" })).toBeVisible();
    await ctx.close();

    const admin = await browser.newContext();
    await signInAs(admin, baseURL!, "admin-qa@example.com");
    const ap = await admin.newPage();
    await ap.goto(`${baseURL}/en/admin`);
    await expect(ap.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
    await expect(ap.getByRole("heading", { level: 2, name: /Organization verification/ })).toBeVisible();
    await admin.close();
  });

  test("built vs planned lists identity verification as built", async ({ page }) => {
    await page.goto("/en/built-vs-planned");
    await expect(page.getByRole("heading", { level: 1, name: "Built vs planned" })).toBeVisible();
    await expect(page.getByText(/Identity and disability-card verification/)).toBeVisible();
  });
});
