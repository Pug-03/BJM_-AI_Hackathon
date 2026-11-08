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
