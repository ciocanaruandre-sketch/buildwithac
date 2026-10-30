import { test, expect } from "@playwright/test";

// în producție apar doar ghidurile adevărate; cele de exemplu (inclusiv cel de test) nu
test.describe("producție", () => {
  test("homepage-ul arată ghidurile adevărate, fără exemple", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("buildwithac");
    await expect(page.locator("#ghiduri")).toBeVisible();
    await expect(page.locator("#ghiduri")).toContainText("Site-uri care nu arată „făcute cu AI”");
    await expect(page.locator("#ghiduri")).not.toContainText("Ghid de test");
    await expect(page.locator("#portofoliu")).toBeVisible();
  });

  test("pagina de ghiduri n-are ghidurile de exemplu", async ({ page }) => {
    await page.goto("/ghiduri");
    await expect(page.locator(".colaj .gc").first()).toBeVisible();
    await expect(page.locator(".colaj")).not.toContainText("Ghid de test");
    await expect(page.locator(".colaj")).not.toContainText("Animații video cu Claude");
    await expect(page.getByText("Primul ghid vine curând.")).toHaveCount(0);
  });

  // statusul HTTP nu se verifică: primul acces dă 200 (problemă cunoscută, amânată pentru Plan 3)
  test("ghidul de test nu există în producție", async ({ page }) => {
    await page.goto("/ghiduri/exemplu-test");
    await expect(page.locator("h1")).not.toHaveText("Ghid de test");
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });

  test("un ghid inexistent duce la 404-ul nostru", async ({ page }) => {
    // slug nou la fiecare rulare: prima cerere, nu una din cache, trebuie să dea 404
    const r = await page.goto(`/ghiduri/nu-exista-${Date.now()}`);
    expect(r!.status()).toBe(404);
    await expect(page.getByRole("link", { name: /ghiduri/i }).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });
});

test.describe("PDF-urile", () => {
  test("robots.txt nu le ascunde, iar PDF-ul răspunde cu noindex", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).not.toContain("/pdf/");
    const r = await request.get("/pdf/harvey-agent-clienti-ef000b11d20a.pdf");
    expect(r.status()).toBe(200);
    expect(r.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  });
});
