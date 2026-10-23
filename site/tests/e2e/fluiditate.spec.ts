import { test, expect } from "@playwright/test";

// panglicile animate costă memorie video: doar secțiunile de pe ecran (sau aproape) se animă
test("Aurora se animă doar în secțiunile de lângă ecran", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.getElementById("servicii")!.scrollIntoView({ behavior: "instant" }));
  const stare = () => page.evaluate(() => ({
    anim: document.getAnimations().filter((a) => (a as CSSAnimation).animationName === "rib" && a.playState === "running").length,
    total: document.querySelectorAll(".secbg .rib").length,
  }));
  // cele de lângă ecran pornesc (observatorul răspunde asincron), restul stau
  await expect.poll(async () => (await stare()).anim).toBeGreaterThan(0);
  const { anim, total } = await stare();
  expect(anim).toBeLessThanOrEqual(9);
  expect(total).toBeGreaterThan(anim);
});

test("pe telefon, peretele de clipuri e mai îngust", async ({ page, isMobile }) => {
  test.skip(!isMobile, "doar pe telefon");
  await page.goto("/");
  const lat = await page.locator(".wall .tilt").evaluate((el) => (el as HTMLElement).offsetWidth);
  expect(lat).toBeLessThanOrEqual(900);
});
