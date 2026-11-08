import { test, expect } from "@playwright/test";
import { enterJudge } from "./helpers";

test.describe("messages", () => {
  test("judge talent: inbox, offer card, send a message, calls explain themselves", async ({ page, baseURL, context }) => {
    test.setTimeout(120_000);
    await enterJudge(context, baseURL!, "talent");
    await page.goto("/en/messages");
    const inbox = page.getByRole("list", { name: "Conversations" });
    await expect(inbox.getByRole("link")).toHaveCount(3);
    await inbox.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/en\/messages\/.+/);
    const log = page.getByRole("log");
    await expect(log).toBeVisible();

    const text = `Hello from QA ${Date.now()}`;
    await page.getByRole("textbox", { name: "Write a message" }).fill(text);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(log.getByText(text)).toBeVisible();
    await expect(log.getByText("Sent").or(log.getByText("Delivered")).last()).toBeAttached();

    // Offers: open the thread that has one
    for (let i = 0; i < 3; i++) {
      await page.goto("/en/messages");
      await inbox.getByRole("link").nth(i).click();
      await expect(page.getByRole("log")).toBeVisible();
      await expect(page.getByRole("log").getByRole("listitem").first()).toBeVisible();
      if (await page.getByRole("article", { name: "Offer" }).count()) break;
    }
    await expect(page.getByRole("article", { name: "Offer" }).first()).toBeVisible();
    await expect(page.getByText("A message, not a contract.").first()).toBeVisible();

    // No Daily key on the QA server: the call button explains why.
    await page.getByRole("button", { name: "Video call" }).first().click();
    await expect(page.getByText("Calls aren’t set up here")).toBeVisible();
  });

  test("two browsers: employer messages talent, talent replies (polling fallback)", async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const tCtx = await browser.newContext();
    const eCtx = await browser.newContext();
    await enterJudge(tCtx, baseURL!, "talent");
    await enterJudge(eCtx, baseURL!, "employer");
    const tp = await tCtx.newPage();
    await tp.goto(`${baseURL}/en/me`);
    await expect(tp.getByRole("heading", { level: 1 })).toBeVisible();
    const line = (await tp.getByText(/^@[a-z0-9-]+ ·/).first().textContent()) ?? "";
    const at = line.match(/^@([a-z0-9-]+)/)?.[1];
    expect(at).toBeTruthy();

    const ep = await eCtx.newPage();
    await ep.goto(`${baseURL}/en/u/${at}`);
    await ep.getByRole("button", { name: "Message" }).first().click();
    await ep.waitForURL(/\/messages\/.+/);
    const hello = `Hi from employer ${Date.now()}`;
    await ep.getByRole("textbox", { name: "Write a message" }).fill(hello);
    await ep.keyboard.press("Enter");
    await expect(ep.getByRole("log").getByText(hello)).toBeVisible();

    await tp.goto(`${baseURL}/en/messages`);
    await tp.getByRole("list", { name: "Conversations" }).getByRole("link").first().click();
    await expect(tp.getByRole("log").getByText(hello)).toBeVisible({ timeout: 15_000 });
    const reply = `Reply from talent ${Date.now()}`;
    await tp.getByRole("textbox", { name: "Write a message" }).fill(reply);
    await tp.keyboard.press("Enter");

    await expect(ep.getByRole("log").getByText(reply)).toBeVisible({ timeout: 15_000 });
    // Read receipt reaches the employer.
    await expect(ep.getByRole("log").getByText("Read").last()).toBeAttached({ timeout: 15_000 });
    await tCtx.close();
    await eCtx.close();
  });
});
