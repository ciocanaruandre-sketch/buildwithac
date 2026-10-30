import { test, expect } from "@playwright/test";
import { ghidulNou } from "../../lib/ghiduri";

// cel mai nou ghid se schimbă la fiecare publicare: îl luăm din conținut, nu-l scriem de mână
const NOU = ghidulNou()!;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.locator("#ghiduri").scrollIntoViewIfNeeded();
});

test("primul card e ghidul cel mai nou, marcat Nou", async ({ page }) => {
  const primul = page.locator("#ghiduri .gcard").first();
  await expect(primul).toContainText("Nou");
  await expect(primul).toContainText(NOU.titlu);
});

test("click pe card deschide panoul cu cuprinsul; Escape îl închide și focusul revine", async ({ page }) => {
  const card = page.locator("#ghiduri .gcard").first();
  await card.click();
  const panou = page.getByRole("dialog");
  await expect(panou).toBeVisible();
  // ghidul cel mai nou e unul adevărat: cuprinsul lui se schimbă, deci verificăm doar că există
  await expect(panou.locator("ol li").first()).toBeVisible();
  await expect(panou).toContainText("Ce găsești în ghid");
  await page.keyboard.press("Escape");
  await expect(panou).toBeHidden();
  await expect(card).toBeFocused();
});

test("Citește ghidul duce la pagina ghidului", async ({ page }) => {
  await page.locator("#ghiduri .gcard").first().click();
  await expect(page.getByRole("dialog").getByRole("link", { name: /Citește ghidul/ })).toHaveAttribute("href", `/ghiduri/${NOU.slug}`);
});

test("ultimul card duce la toate ghidurile", async ({ page }) => {
  await expect(page.locator("#ghiduri a.gcard.more")).toHaveAttribute("href", "/ghiduri");
});

test("cu Tab prin pista fixată, fiecare card ajunge în ecran", async ({ page, isMobile }) => {
  test.skip(isMobile, "Tab-ul de la tastatură e pe desktop");
  const carduri = page.locator("#ghiduri .gcard");
  const n = await carduri.count();
  await carduri.first().focus();
  for (let i = 1; i < n; i++) {
    await page.keyboard.press("Tab");
    await expect(carduri.nth(i)).toBeFocused();
    // pista se mișcă cu scrub, deci cu o mică întârziere
    await expect.poll(async () => {
      const c = (await carduri.nth(i).boundingBox())!;
      const v = page.viewportSize()!;
      return c.x >= 0 && c.x + c.width <= v.width && c.y >= 0 && c.y + c.height <= v.height;
    }, { timeout: 4000 }).toBe(true);
  }
});

test("un click pe un card nu mută pagina, doar deschide panoul", async ({ page }) => {
  await page.locator("#ghiduri .gcard").nth(1).hover();
  const inainte = await page.evaluate(() => scrollY);
  await page.locator("#ghiduri .gcard").nth(1).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(inainte);
});
