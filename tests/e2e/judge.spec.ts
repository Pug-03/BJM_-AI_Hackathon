import { test, expect } from "@playwright/test";

test("judge mode: enter as talent, switch to employer, exit", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/en/judge");
  await page.getByRole("button", { name: /Try as talent/ }).click();
  await expect(page).toHaveURL(/\/en\/feed/, { timeout: 60_000 });
  const banner = page.getByRole("region", { name: "Judge mode" });
  await expect(banner).toContainText("Judge mode — sample data.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your feed");
  await banner.getByRole("button", { name: "Switch to employer" }).click();
  await expect(banner.getByRole("button", { name: "Switch to talent" })).toBeVisible({ timeout: 60_000 });
  await banner.getByRole("button", { name: "Exit" }).click();
  await expect(page).toHaveURL(/\/en$/);
});

test("judge dialog opens from the footer", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Judge mode" }).click();
  const dialog = page.getByRole("dialog", { name: "Try ABLE with sample data" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Try as an employer/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});
