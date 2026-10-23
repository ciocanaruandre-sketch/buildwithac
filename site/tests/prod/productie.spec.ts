import { test, expect } from "@playwright/test";

// în producție, până la primul ghid real, nu există niciun ghid
test.describe("producție fără ghiduri", () => {
  test("homepage-ul nu arată secțiunea de ghiduri goală", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("buildwithac");
    await expect(page.locator("#ghiduri")).toHaveCount(0);
    await expect(page.locator("#portofoliu")).toBeVisible();
  });

  test("pagina de ghiduri spune că primul ghid vine curând", async ({ page }) => {
    await page.goto("/ghiduri");
    await expect(page.getByRole("heading", { name: "Primul ghid vine curând." })).toBeVisible();
    await expect(page.getByText("Nu găsesc ghidul ăsta.")).toHaveCount(0);
  });

  test("un ghid inexistent duce la 404-ul nostru", async ({ page }) => {
    await page.goto("/ghiduri/ceva-gresit");
    await expect(page.getByRole("link", { name: /ghiduri/i }).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });
});
