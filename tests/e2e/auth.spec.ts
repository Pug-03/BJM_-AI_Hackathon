import { test, expect } from "@playwright/test";

/**
 * Email OTP flow. Needs a database and ABLE_E2E_OTP set on the server
 * (e.g. ABLE_E2E_OTP=424242) so the code is predictable in tests.
 */
const OTP = process.env.ABLE_E2E_OTP;

test("protected routes redirect to login with next", async ({ page }) => {
  await page.goto("/en/feed");
  await expect(page).toHaveURL(/\/en\/login\?next=%2Ffeed/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to ABLE");
});

test("invalid email shows a linked error", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue with email" }).click();
  const input = page.getByLabel("Email address");
  await input.fill("not-an-email");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
});

test("sign up with email OTP → welcome → choose role", async ({ page }) => {
  test.skip(!OTP, "ABLE_E2E_OTP not set");
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  // Paste the whole code into the first box.
  await page.getByLabel("Digit 1 of 6").focus();
  await page.evaluate((code) => {
    const dt = new DataTransfer();
    dt.setData("text", code);
    document.activeElement?.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
  }, OTP!);
  await expect(page).toHaveURL(/\/en\/welcome/, { timeout: 15_000 });
  await page.getByText("I’m looking for work").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/en\/onboarding\/talent/);
});

test("wrong code shows an error", async ({ page }) => {
  test.skip(!OTP, "ABLE_E2E_OTP not set");
  await page.goto("/en/login");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("Email address").fill(`wrong-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Send code" }).click();
  for (let i = 1; i <= 6; i++)
    await page.getByLabel(`Digit ${i} of 6`).fill(String((Number(OTP![i - 1]) + 1) % 10));
  await expect(page.getByText("That code isn’t right")).toBeVisible();
});
