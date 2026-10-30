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
  await expect(page.getByRole("dialog").getByRole("link", { name: /Citește ghidul/ })).toHaveAttribute("href", "/ghiduri/site-uri-fara-aer-de-ai");
});

test("ultimul card duce la toate ghidurile", async ({ page }) => {
  await expect(page.locator("#ghiduri a.gcard.more")).toHaveAttribute("href", "/ghiduri");
});
