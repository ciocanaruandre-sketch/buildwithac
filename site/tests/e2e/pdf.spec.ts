import { test, expect } from "@playwright/test";
import { tiparesteGhid } from "../../scripts/pdf/tipar";

const URL = "/ghiduri/exemplu-test";

// page.pdf merge doar în Chromium
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "doar în Chromium"));

test("în tipar: ce nu e ghid dispare, pașii și capturile sunt toate vizibile", async ({ page }) => {
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  await page.goto(URL);
  const ascunse = await page.locator("[data-fara-tipar]").all();
  expect(ascunse.length).toBeGreaterThan(5);
  for (const el of ascunse) await expect(el).toBeHidden();
  const pasi = page.locator("section.k-sheet");
  await expect(pasi).toHaveCount(5);
  for (const p of await pasi.all()) {
    await expect(p).toBeVisible();
    expect(await p.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  }
  await expect(page.locator(".prompt pre").first()).toBeVisible();
});

test("PDF-ul iese, are mai multe pagini și imaginile încărcate", async ({ page, baseURL }) => {
  const buf = await tiparesteGhid(page, `${baseURL}${URL}`);
  expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  expect(buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)!.length).toBeGreaterThan(1);
  const incarcate = await page.locator("img").evaluateAll((imgs) =>
    imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0));
  expect(incarcate).toBe(true);
});

test("o imagine care a eșuat deja oprește PDF-ul cu numele ei, nu așteaptă la nesfârșit", async ({ page }) => {
  const inceput = Date.now();
  await expect(tiparesteGhid(page, "data:text/html,<img src='http://127.0.0.1:9/lipsa.png'>")).rejects.toThrow(/lipsa\.png/);
  expect(Date.now() - inceput).toBeLessThan(5000);
});
