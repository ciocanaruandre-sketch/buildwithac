import { test, expect } from "@playwright/test";

// panglicile animate costă memorie video: doar secțiunile de pe ecran (sau aproape) se animă
const panglici = (page: import("@playwright/test").Page) => page.evaluate(() => ({
  anim: document.getAnimations().filter((a) => (a as CSSAnimation).animationName === "rib" && a.playState === "running").length,
  total: document.querySelectorAll(".secbg .rib").length,
}));

test("Aurora se animă doar în secțiunile de lângă ecran", async ({ page, isMobile }) => {
  test.skip(isMobile, "pe telefon panglicile stau pe loc");
  await page.goto("/");
  await page.evaluate(() => document.getElementById("servicii")!.scrollIntoView({ behavior: "instant" }));
  const stare = () => panglici(page);
  // cele de lângă ecran pornesc (observatorul răspunde asincron), restul stau
  await expect.poll(async () => (await stare()).anim).toBeGreaterThan(0);
  const { anim, total } = await stare();
  expect(anim).toBeLessThanOrEqual(9);
  expect(total).toBeGreaterThan(anim);
});

// mișcate, obligau telefonul să refacă la fiecare cadru amestecul cu textura și sticla mată din Contact
test("pe telefon, panglicile Aurora stau pe loc și n-au blur", async ({ page, isMobile }) => {
  test.skip(!isMobile, "doar pe telefon");
  await page.goto("/");
  await page.evaluate(() => document.getElementById("servicii")!.scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(300);
  const { anim, total } = await panglici(page);
  expect(total).toBeGreaterThan(0);
  expect(anim).toBe(0);
  expect(await page.locator(".secbg .rib").first().evaluate((el) => getComputedStyle(el).filter)).toBe("none");
});

test("pe telefon, peretele de clipuri e mai îngust", async ({ page, isMobile }) => {
  test.skip(!isMobile, "doar pe telefon");
  await page.goto("/");
  const lat = await page.locator(".wall .tilt").evaluate((el) => (el as HTMLElement).offsetWidth);
  expect(lat).toBeLessThanOrEqual(900);
});
