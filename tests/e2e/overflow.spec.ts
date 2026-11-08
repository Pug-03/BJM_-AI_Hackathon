import { test, expect, devices } from "@playwright/test";

/** With animations ON (the screenshot suite runs with reduced motion), phones must never scroll sideways. */
test.describe("no horizontal scroll with motion on", () => {
  for (const path of ["/th", "/en", "/en/explore", "/th/login", "/en/privacy"]) {
    test(path, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ ...devices["iPhone 13"], reducedMotion: "no-preference" });
      await ctx.addCookies([{ name: "able-cookies", value: "necessary", url: baseURL! }]);
      const page = await ctx.newPage();
      await page.goto(path);
      for (let i = 0; i < 8; i++) {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `sideways scroll at step ${i}`).toBeLessThanOrEqual(0);
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(150);
      }
      await ctx.close();
    });
  }
});

test("header pill stays clickable after scrolling (desktop and phone)", async ({ browser, baseURL }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 393, height: 852 }]) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addCookies([{ name: "able-cookies", value: "necessary", url: baseURL! }]);
    const page = await ctx.newPage();
    await page.goto("/en");
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(700);
    await page.getByRole("banner").getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/login/);
    await ctx.close();
  }
});
