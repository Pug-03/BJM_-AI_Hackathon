import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { locales, routes, themes } from "./routes";
import { signInFresh } from "./helpers";

for (const r of routes.filter((x) => !x.auth || x.auth === "new")) {
  for (const locale of locales) {
    for (const theme of themes) {
      test(`axe ${r.name} ${locale} ${theme}`, async ({ browser, baseURL }) => {
        const ctx = await browser.newContext({ colorScheme: theme });
        if (r.auth === "new") await signInFresh(ctx, baseURL!);
        const page = await ctx.newPage();
        await page.goto(`/${locale}${r.path === "/" ? "" : r.path}`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          bad.map(
            (v) =>
              `${v.id}: ${v.nodes
                .map((n) => n.target.join(" "))
                .slice(0, 3)
                .join(", ")}`,
          ),
        ).toEqual([]);
        await ctx.close();
      });
    }
  }
}
