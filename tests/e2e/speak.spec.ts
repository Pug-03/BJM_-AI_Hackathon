import { test, expect } from "@playwright/test";
import { signInFresh } from "./helpers";

/**
 * "Speak to fill" without AI keys (the QA server runs keyless): every mic and AI button
 * must explain why it's unavailable — never a dead button (section 2).
 */
test.describe("speak to fill", () => {
  test("transcribe API requires sign-in", async ({ request }) => {
    const res = await request.post("/api/ai/transcribe", { multipart: { audio: "x" } });
    expect(res.status()).toBe(401);
  });

  test("mic and voice-fill explain themselves when keys are missing", async ({ page, baseURL, context }) => {
    await signInFresh(context, baseURL!, "talent");
    await page.goto("/en/onboarding/talent");
    await expect(page.getByRole("heading", { name: "Fill my profile by voice" })).toBeVisible();

    await page.getByRole("button", { name: "Speak to fill First name" }).click();
    await expect(page.getByText("Voice input isn’t set up here")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Start speaking" }).click();
    await expect(page.getByText(/Filling your profile by voice needs/)).toBeVisible();
    await page.keyboard.press("Escape");

    const res = await page.request.post("/api/ai/transcribe", { multipart: { audio: "x" } });
    expect([403, 503]).toContain(res.status());
  });

  test("write with AI explains itself when keys are missing", async ({ page, baseURL, context }) => {
    await signInFresh(context, baseURL!, "talent");
    await page.goto("/en/onboarding/talent");
    await page.getByRole("textbox", { name: /^First name/ }).fill("Ari");
    await page.getByRole("textbox", { name: /^Last name/ }).fill("Speaker");
    await expect(page.getByLabel("Profile link")).not.toHaveValue("", { timeout: 10_000 });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Speak to fill Bio" })).toBeVisible();
    await page.getByRole("button", { name: "Write with AI" }).click();
    await expect(page.getByText("AI writing isn’t set up here")).toBeVisible();
  });
});
