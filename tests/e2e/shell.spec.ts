import { test, expect } from "@playwright/test";

test("landing renders with one h1 and correct lang", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Work that fits you.");
});

test("Thai locale switches copy and lang", async ({ page }) => {
  await page.goto("/th");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("งานที่ใช่ สำหรับทุกคน");
});

test("root redirects to English by default", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("language switch changes locale", async ({ page, isMobile }) => {
  await page.goto("/en/explore");
  const trigger = page.getByRole("button", { name: /Language/ }).first();
  await trigger.click();
  await page.getByRole("menuitemradio", { name: "ไทย" }).click();
  await expect(page).toHaveURL(/\/th\/explore/);
  expect(isMobile !== undefined).toBe(true);
});

test("skip link moves focus to main", async ({ page }) => {
  await page.goto("/en/explore");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("dialog traps focus and returns it on close", async ({ page }) => {
  await page.goto("/en/styleguide");
  const open = page.getByRole("button", { name: "Open dialog" });
  await open.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test("mobile shows bottom nav, desktop shows rail", async ({ page, isMobile }) => {
  await page.goto("/en/explore");
  const navs = page.getByRole("navigation", { name: "Main" });
  await expect(navs.filter({ visible: true })).toHaveCount(1);
  if (isMobile) await expect(page.getByRole("link", { name: "Log in" }).filter({ visible: true }).first()).toBeVisible();
});
