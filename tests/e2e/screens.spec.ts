import { test, expect } from "@playwright/test";
import { locales, routes, themes, viewports } from "./routes";

/**
 * QA screenshots: every route × 12 viewports × light/dark × EN/TH.
 * Filter with QA_STAGE=3 to only shoot pages touched in a stage.
 * Output: qa/screens/stage-<n>/<route>/<locale>-<theme>-<viewport>.png
 */
const stage = process.env.QA_STAGE ? Number(process.env.QA_STAGE) : undefined;
const selected = routes.filter((r) => !r.auth && (stage === undefined || r.stage === stage));

for (const r of selected) {
  for (const locale of locales) {
    for (const theme of themes) {
      test(`${r.name} ${locale} ${theme}`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: theme, reducedMotion: "reduce" });
        const page = await ctx.newPage();
        // Hide the environment notice and consent banner so shots show the product.
        await page.addInitScript(() => {
          try {
            localStorage.setItem("able-qa", "1");
          } catch {}
        });
        for (const vp of viewports) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(`/${locale}${r.path === "/" ? "" : r.path}`, { waitUntil: "networkidle" });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          expect.soft(overflow, `horizontal overflow on ${r.name} ${vp.name}`).toBeLessThanOrEqual(0);
          await page.screenshot({
            path: `qa/screens/stage-${r.stage}/${r.name}/${locale}-${theme}-${vp.name}.png`,
            fullPage: true,
          });
        }
        await ctx.close();
      });
    }
  }
}
