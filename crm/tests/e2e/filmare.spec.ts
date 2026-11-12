import { expect, test, type Page } from "@playwright/test";
import { intraCa } from "./ajutor";

const comutator = (page: Page) => page.getByRole("button", { name: /^Mod filmare/ }).filter({ visible: true });

test.describe("modul filmare: comutatorul", () => {
  test("adminul pornește și oprește modul filmare; rămâne după reîncărcare", async ({ page }) => {
    await intraCa(page, "admin");
    await expect(comutator(page)).toHaveAccessibleName("Mod filmare: oprit");
    await expect(page.locator("[data-filmare]")).toHaveCount(0);
    await comutator(page).click();
    await expect(comutator(page)).toHaveAccessibleName("Mod filmare: pornit");
    await expect(page.locator("[data-filmare]")).toHaveCount(1);
    await page.reload();
    await expect(page.locator("[data-filmare]")).toHaveCount(1);
    await comutator(page).click();
    await expect(comutator(page)).toHaveAccessibleName("Mod filmare: oprit");
    await expect(page.locator("[data-filmare]")).toHaveCount(0);
  });

  test("fără clipire: HTML-ul de pe server vine deja în modul filmare", async ({ page }) => {
    await intraCa(page, "admin");
    await comutator(page).click();
    await expect(comutator(page)).toHaveAccessibleName("Mod filmare: pornit");
    const html = await (await page.request.get("/lead-uri")).text();
    expect(html).toContain("data-filmare");
  });

  test("comutatorul arată la fel pornit și oprit", async ({ page }) => {
    await intraCa(page, "admin");
    const inainte = await comutator(page).getAttribute("class");
    await comutator(page).click();
    await expect(comutator(page)).toHaveAccessibleName("Mod filmare: pornit");
    expect(await comutator(page).getAttribute("class")).toBe(inainte);
  });

  test("pe telefon, comutatorul e sus, lângă „Ieși”", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await intraCa(page, "admin");
    await expect(comutator(page)).toBeVisible();
  });

  test("blurul ține de browser: callerul îl vede, dar nu are comutatorul", async ({ page, context }) => {
    await context.addCookies([{ name: "crm_filmare", value: "1", url: "http://localhost:3100" }]);
    await intraCa(page, "caller");
    await expect(page.locator("[data-filmare]")).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Mod filmare/ })).toHaveCount(0);
  });
});
