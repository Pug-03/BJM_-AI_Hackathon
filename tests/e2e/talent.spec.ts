import { test, expect } from "@playwright/test";
import path from "path";
import { signInFresh } from "./helpers";

test.describe("talent onboarding + profile", () => {
  test("builds a profile through 5 steps and shows it", async ({ page, baseURL, context }) => {
    test.setTimeout(120_000);
    await signInFresh(context, baseURL!, "talent");
    await page.goto("/en/welcome");
    await page.getByText("I’m looking for work").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/en\/onboarding\/talent/);

    // Step 1
    await page.getByLabel("First name").fill("Nina");
    await page.getByLabel("Last name").fill("Tester");
    await expect(page.getByLabel("Profile link")).not.toHaveValue("", { timeout: 10_000 });
    await page
      .locator('input[type="file"][accept="image/*"]')
      .first()
      .setInputFiles(path.join(__dirname, "../fixtures/photo.png"));
    await page.getByRole("button", { name: "Use photo" }).click();
    await expect(page.getByRole("button", { name: "Change photo" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    await page.getByLabel("Headline").fill("QA specialist");
    await page.getByText("Remote", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3
    await page.getByLabel("Skills").fill("Manual testing");
    await page.keyboard.press("Enter");
    await page.getByLabel("Skills").fill("Excel");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4 → 5
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Contact and privacy" })).toBeVisible();
    await page.getByRole("button", { name: "Finish" }).click();
    await expect(page.getByRole("heading", { name: "Your profile is ready" })).toBeVisible();
    await page.getByRole("link", { name: "View my profile" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Nina Tester" })).toBeVisible();
    await expect(page.getByText("QA specialist")).toBeVisible();
    await expect(page.getByText("Manual testing")).toBeVisible();
    await expect(page.getByRole("button", { name: /Finish your profile/ })).toBeVisible();

    // New post
    await page.getByRole("button", { name: "New post" }).click();
    await page.getByLabel("New post").fill("Finished my first accessibility audit.");
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await expect(page.getByText("Finished my first accessibility audit.")).toBeVisible();
  });

  test("sample profile renders tabs, reviews and lightbox", async ({ page }) => {
    await page.goto("/en/u/kittipong-design");
    await expect(page.getByRole("heading", { level: 1, name: "Kittipong Wongsa" })).toBeVisible();
    await page.getByRole("tab", { name: /Reviews/ }).click();
    await expect(page.getByText("Beautiful boards, delivered early.")).toBeVisible();
    await page.getByRole("tab", { name: /Portfolio/ }).click();
    await page.getByRole("button", { name: "Open image 1" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("privacy — private fields never leave the server", () => {
  test("public profile HTML has no DOB, gender, work-setup or hidden contacts", async ({ request }) => {
    // Mali (sample) has DOB 1996, work setup "Screen reader (NVDA) and remote work", chat-only email + LINE.
    const res = await request.get("/en/u/mali-srisuk");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain("Mali Srisuk");
    expect(html).not.toContain("1996-06-15");
    expect(html).not.toContain("Screen reader (NVDA)");
    expect(html).not.toContain("mali.sample@able.example");
    expect(html).not.toMatch(/"workSetupNeeds"|"gender"|"dob"/);
  });

  test("sandbox (judge) profiles are invisible to real visitors", async ({ request }) => {
    const res = await request.get("/en/u/ploy-00000000");
    const html = await res.text();
    expect(html).toContain("Profile not found");
  });
});
