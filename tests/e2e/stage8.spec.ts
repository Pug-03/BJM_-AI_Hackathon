import { test, expect } from "@playwright/test";
import JSZip from "jszip";
import { signInFresh } from "./helpers";

test.describe("landing, policies, cookies", () => {
  test("landing has every section 6 block and working anchors", async ({ page }) => {
    await page.goto("/en");
    for (const name of [
      "How it works",
      "Say it. ABLE fills it in.",
      "Why ABLE",
      "How do I…?",
      "Questions and answers",
    ])
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    await expect(page.getByText("Thank you to our supporters for making ABLE possible.")).toBeVisible();
    await expect(page.getByRole("tab", { name: "For employers" })).toBeVisible();
    await page.getByRole("tab", { name: "For employers" }).click();
    await expect(page.getByRole("heading", { level: 3, name: /Browse your matches/ })).toBeVisible();
    await page.getByRole("button", { name: "Do I have to say I have a disability?" }).click();
    await expect(page.locator("#faq").getByText(/Nothing asks about disability/)).toBeVisible();
    // Sponsors are never in the header
    await expect(page.getByRole("banner").getByText("Sponsor logo")).toHaveCount(0);
  });

  test("policy pages render in EN and TH", async ({ page }) => {
    for (const [path, h1] of [
      ["/en/privacy", "Privacy policy"],
      ["/en/terms", "Terms of use"],
      ["/en/cookies", "Cookies"],
      ["/en/data-rights", "Your data rights"],
      ["/en/accessibility", "Accessibility statement"],
      ["/th/privacy", "นโยบายความเป็นส่วนตัว"],
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    }
  });

  test.describe("first visit", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test("cookie banner: first visit only, choices persist, reopen from footer", async ({ page }) => {
      await page.goto("/en");
      const banner = page.getByRole("region", { name: "Cookies on ABLE" });
      await expect(banner).toBeVisible();
      await expect(banner).toContainText("No analytics or ads");
      await banner.getByRole("button", { name: "Reject optional" }).click();
      await expect(banner).toBeHidden();
      await page.reload();
      await expect(banner).toBeHidden();
      await page.getByRole("button", { name: "Cookie settings" }).click();
      await expect(banner.getByRole("switch", { name: /Analytics/ })).not.toBeChecked();
    });
  });
});

test.describe("settings", () => {
  test("download my data, then delete the account", async ({ page, context, baseURL }) => {
    test.setTimeout(90_000);
    const email = await signInFresh(context, baseURL!, "settings");
    await page.goto("/en/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();

    const res = await page.request.get("/api/export");
    expect(res.ok()).toBeTruthy();
    const zip = await JSZip.loadAsync(await res.body());
    const data = JSON.parse(await zip.file("data.json")!.async("string"));
    expect(data.account.email).toBe(email);
    expect(data.consents.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Delete account" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete your account?" });
    await expect(dialog.getByRole("button", { name: "Delete my account" })).toBeDisabled();
    await dialog.getByRole("textbox").fill(email);
    await dialog.getByRole("button", { name: "Delete my account" }).click();
    await expect(page).toHaveURL(/\/en$/);
    const after = await page.request.get("/api/export");
    expect(after.status()).toBe(401);
  });
});
