import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  // Cookie choice pre-set so the first-visit banner doesn't cover controls (stage8.spec tests the banner itself).
  use: { baseURL, trace: "retain-on-failure", storageState: "tests/fixtures/consent.json" },
  projects: [
    { name: "desktop", testIgnore: /screens\.spec/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testIgnore: /screens\.spec|a11y\.spec/, use: { ...devices["Pixel 7"] } },
    { name: "screens", testMatch: /screens\.spec/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: `${baseURL}/en`,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
