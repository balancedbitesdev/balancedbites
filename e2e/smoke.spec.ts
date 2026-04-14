import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home loads with hero and main", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("account page loads", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /my account/i })).toBeVisible();
  });

  test("menu page renders", async ({ page }) => {
    await page.goto("/menu");
    await expect(page.getByRole("heading", { name: /our menu/i })).toBeVisible();
  });
});
