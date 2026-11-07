import { test, expect } from "@playwright/test";
import { locales, routes, themes, viewports } from "./routes";
import { signInFresh } from "./helpers";

/**
 * QA screenshots: every route × 12 viewports × light/dark × EN/TH.
 * Filter with QA_STAGE=3 to only shoot pages touched in a stage.
 * Output: qa/screens/stage-<n>/<route>/<locale>-<theme>-<viewport>.png
 */
const stage = process.env.QA_STAGE ? Number(process.env.QA_STAGE) : undefined;
// QA_QUICK=1 → quick check (section 12.1): 3 viewports, light theme, English only.
const quick = process.env.QA_QUICK === "1";
const vps = quick ? viewports.filter((v) => ["390x844", "820x1180", "1440x900"].includes(v.name)) : viewports;
const locs = quick ? (["en"] as const) : locales;
const ths = quick ? (["light"] as const) : themes;
const selected = routes.filter(
  (r) => (!r.auth || r.auth === "new") && (stage === undefined || r.stage === stage),
);

for (const r of selected) {
  for (const locale of locs) {
    for (const theme of ths) {
      test(`${r.name} ${locale} ${theme}`, async ({ browser, baseURL }) => {
        const ctx = await browser.newContext({ colorScheme: theme, reducedMotion: "reduce" });
        if (r.auth === "new") await signInFresh(ctx, baseURL!);
        const page = await ctx.newPage();
        // Hide the environment notice and consent banner so shots show the product.
        await page.addInitScript(() => {
          try {
            localStorage.setItem("able-qa", "1");
          } catch {}
        });
        for (const vp of vps) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(`/${locale}${r.path === "/" ? "" : r.path}`, { waitUntil: "load" });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(400);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
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
