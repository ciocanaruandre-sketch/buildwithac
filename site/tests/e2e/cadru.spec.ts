import { test, expect } from "@playwright/test";
import { SITE } from "../../lib/config";

const ORDINE = ["Ghiduri", "Pentru cine", "Social media", "Portofoliu", "Servicii", "Contact"];

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "doar pe desktop");

  test("bara are cele 6 elemente, în ordine", async ({ page }) => {
    await page.goto("/");
    const elemente = page.locator("nav .links > a, nav .links > .dd > button");
    await expect(elemente).toHaveText(ORDINE.map((t) => new RegExp(`^${t}`)));
  });

  test("Social media deschide meniul cu Instagram și TikTok", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Social media/ }).click();
    const meniu = page.locator("nav .ddm");
    await expect(meniu.getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", SITE.instagram.url);
    await expect(meniu.getByRole("link", { name: /TikTok/ })).toHaveAttribute("href", SITE.tiktok.url);
    await expect(meniu.getByRole("link", { name: /Instagram/ })).toBeVisible();
  });
});

test.describe("mobil", () => {
  test.skip(({ isMobile }) => !isMobile, "doar pe telefon");

  test("☰ deschide meniul, Escape îl închide", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav .links")).toBeHidden();
    await page.getByRole("button", { name: "Meniu" }).click();
    const meniu = page.getByRole("dialog", { name: "Meniu" });
    await expect(meniu).toBeVisible();
    for (const t of ["Ghiduri", "Pentru cine", "Portofoliu", "Servicii", "Contact", "Instagram", "TikTok"]) {
      await expect(meniu.getByRole("link", { name: t })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(meniu).toBeHidden();
  });

  test("în meniul ☰, Tab rămâne în meniu, iar la închidere focusul revine pe ☰", async ({ page }) => {
    await page.goto("/");
    const burger = page.getByRole("button", { name: "Meniu" });
    await burger.click();
    const meniu = page.getByRole("dialog", { name: "Meniu" });
    await expect(meniu.getByRole("button", { name: "Închide meniul" })).toBeFocused();
    // ✕ + 5 link-uri + 2 rețele = 8; a noua apăsare trece de capăt
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press("Tab");
      expect(await meniu.evaluate((m) => m.contains(document.activeElement))).toBe(true);
    }
    await meniu.getByRole("button", { name: "Închide meniul" }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(meniu.getByRole("link", { name: "TikTok" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(burger).toBeFocused();
  });
});

test("footer-ul are link spre confidențialitate", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer").getByRole("link", { name: /Confidențialitate/ })).toHaveAttribute("href", "/confidentialitate");
  await expect(page.locator("footer")).toContainText("buildwithac");
});

test.describe("reduce motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("fără Lenis, contactul se vede după scroll până jos", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator("footer")).toBeInViewport();
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
  });
});

test("cu mișcare, Lenis pornește", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
});
