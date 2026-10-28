import { test, expect } from "@playwright/test";

test("sitemap-ul are paginile și ghidurile", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const cale of ["/", "/ghiduri", "/ghiduri/site-uri-fara-aer-de-ai", "/confidentialitate"]) {
    expect(xml).toContain(`https://buildwithac.ro${cale === "/" ? "" : cale}<`);
  }
});

test("în afara producției, robots.txt blochează indexarea", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toMatch(/Disallow: \//);
});

test("pagina de ghid are titlu și imagine Open Graph", async ({ page }) => {
  await page.goto("/ghiduri/exemplu-test");
  await expect(page).toHaveTitle("Ghid de test · buildwithac");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/ghiduri\/exemplu-test\/cover\.webp$/);
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
});
