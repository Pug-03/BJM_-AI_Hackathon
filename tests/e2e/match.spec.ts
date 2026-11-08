import { test, expect } from "@playwright/test";
import { enterJudge, signInFresh } from "./helpers";

test.describe("employer onboarding + matched feed", () => {
  test("builds an organization, publishes a position and sees matches", async ({ page, baseURL, context }) => {
    test.setTimeout(150_000);
    await signInFresh(context, baseURL!, "employer");
    await page.goto("/en/welcome");
    await page.getByText("I’m hiring").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/en\/onboarding\/employer/);

    // Step 1 — who
    await page.getByText("Startup", { exact: true }).click();
    const name = `QA Labs ${Date.now()}`;
    await page.getByRole("textbox", { name: /^Organization name/ }).fill(name);
    await expect(page.getByRole("textbox", { name: /^Profile link/ })).not.toHaveValue("");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2 — about
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    await page.getByRole("textbox", { name: /^Industry/ }).fill("Customer service");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 — first position (no salary field, soft age note)
    await expect(page.getByRole("heading", { level: 1, name: "Who you’re hiring" })).toBeVisible();
    await expect(page.getByText(/never hides anyone/)).toBeVisible();
    await expect(page.getByLabel(/salary/i)).toHaveCount(0);
    await page.getByRole("textbox", { name: /^Job title/ }).fill("Customer support specialist");
    await page.getByLabel("Skills needed").fill("Customer support");
    await page.keyboard.press("Enter");
    await page.getByLabel("Skills needed").fill("Live chat");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4 — review → feed
    await expect(page.getByRole("heading", { level: 1, name: "Review and publish" })).toBeVisible();
    await page.getByRole("button", { name: "Publish and see matches" }).click();
    await expect(page).toHaveURL(/\/en\/feed/);
    await expect(page.getByRole("heading", { level: 1, name: "Matched talent" })).toBeVisible();
    // Scores compute in the background after publishing; reload until cards appear.
    await expect(async () => {
      await page.reload();
      await expect(page.getByRole("article").first()).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 45_000 });
    await expect(page.getByText("Why this match").first()).toBeVisible();
  });

  test("judge employer: star, skip with undo, and fair filters", async ({ page, baseURL, context }) => {
    test.setTimeout(120_000);
    await enterJudge(context, baseURL!, "employer");
    await page.goto("/en/feed");
    const first = page.getByRole("article").first();
    await expect(first).toBeVisible({ timeout: 30_000 });
    const name = (await first.getByRole("heading", { level: 2 }).textContent())?.trim() ?? "";
    const starBtn = first.getByRole("button", { name: /^(Star|Remove star)$/ });
    const was = await starBtn.getAttribute("aria-pressed");
    await starBtn.click();
    await expect(starBtn).toHaveAttribute("aria-pressed", was === "true" ? "false" : "true");

    await first.getByRole("button", { name: "Skip", exact: true }).click();
    await expect(page.getByRole("heading", { level: 2, name })).toHaveCount(0);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();

    await page.getByRole("button", { name: /^Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toContainText("never filters by disability");
    await expect(sheet.getByText(/^(Disability|Gender|Religion|Ethnicity)$/i)).toHaveCount(0);
    await sheet.getByRole("button", { name: "Show results" }).click();
  });

  test("judge talent sees matched positions and employer pages", async ({ page, baseURL, context }) => {
    test.setTimeout(120_000);
    await enterJudge(context, baseURL!, "talent");
    await page.goto("/en/feed");
    await expect(page.getByRole("heading", { level: 1, name: "Opportunities for you" })).toBeVisible();
    const card = page.getByRole("article").first();
    await expect(card).toBeVisible();
    await card.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/en\/o\//);
    await expect(page.getByRole("heading", { level: 2, name: /open position/ }).first()).toBeVisible();
  });
});

test.describe("explore", () => {
  test("search and filter the public directory while logged out", async ({ page }) => {
    await page.goto("/en/explore");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("article").first()).toBeVisible();
    await page.getByRole("searchbox", { name: "Search talent" }).fill("design");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/q=design/);
    await expect(page.getByRole("link", { name: "Kittipong Wongsa" })).toBeVisible();
    // Unknown filter keys in the URL are ignored (strict schema), never applied.
    await page.goto("/en/explore?disability=blind&gender=female");
    await expect(page.getByRole("article").first()).toBeVisible();
  });
});
