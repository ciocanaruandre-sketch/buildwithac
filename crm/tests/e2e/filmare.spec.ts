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

test.describe("modul filmare: blurul pe ecrane", () => {
  const filtru = (l: ReturnType<Page["locator"]>) => l.evaluate((e) => getComputedStyle(e).filter);
  const raza = (f: string) => Number(/blur\(([\d.]+)px\)/.exec(f)?.[1] ?? 0);

  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "crm_filmare", value: "1", url: "http://localhost:3100" }]);
  });

  test("lista de lead-uri: numele și telefonul sunt blurate, starea nu", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/lead-uri");
    const rand = page.locator("tbody tr").first();
    await expect(rand.locator("a[href^='/lead-uri/'] .ascuns")).toHaveCount(1);
    expect(raza(await filtru(rand.locator(".ascuns").first()))).toBeGreaterThanOrEqual(4);
    await expect(rand.locator("td").first().locator(".ascuns")).toHaveCount(2);
    await expect(page.locator("tbody .chip").first()).toBeVisible();
    await expect(page.locator("tbody .ascuns .chip")).toHaveCount(0);
  });

  test("fișa lead-ului: titlul, firimitura, telefonul și e-mailul sunt blurate", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/lead-uri");
    await page.locator("tbody tr").first().locator("a[href^='/lead-uri/']").click();
    await expect(page).toHaveURL(/\/lead-uri\/[0-9a-f-]+$/);
    await expect(page.locator("h1 .ascuns")).toBeVisible();
    await expect(page.locator("b .ascuns").filter({ visible: true })).toHaveCount(1);
    const contact = page.locator(".panel").filter({ has: page.getByText("Contact", { exact: true }) }).first();
    await expect(contact.locator("dd .ascuns").first()).toBeVisible();
    expect(await page.title()).toBe("CRM buildwithac");
  });

  test("titlul mare e blurat pe măsura lui (pe 30px, 4px nu ajung)", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/lead-uri");
    await page.locator("tbody tr").first().locator("a[href^='/lead-uri/']").click();
    const titlu = page.locator("h1 .ascuns");
    const { f, marime } = await titlu.evaluate((e) => ({ f: getComputedStyle(e).filter, marime: parseFloat(getComputedStyle(e).fontSize) }));
    expect(raza(f) / marime).toBeGreaterThanOrEqual(0.28);
  });

  test("liniuța „—” (fără e-mail sau telefon) nu se blurează", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/lead-uri");
    await page.locator("tbody tr").first().locator("a[href^='/lead-uri/']").click();
    await expect(page.locator("h1 .ascuns")).toBeVisible();
    await expect(page.locator(".ascuns", { hasText: /^—$/ })).toHaveCount(0);
  });

  test("fișa clientului: numele, inițialele, contactul și conturile sunt blurate; prețul nu", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/clienti");
    await page.locator("tbody a[href^='/clienti/']").first().click();
    await expect(page).toHaveURL(/\/clienti\/[0-9a-f-]+/);
    await expect(page.locator("h1 .ascuns")).toBeVisible();
    await expect(page.locator("[aria-hidden] > .ascuns").first()).toBeAttached();
    await expect(page.getByTestId("contact").locator("dd .ascuns").first()).toBeVisible();
    await expect(page.locator(".ascuns", { hasText: "lei" })).toHaveCount(0);
  });

  test("Task-urile mele: numele clientului e blurat, titlul task-ului nu", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/taskuri");
    const link = page.locator("a[href^='/clienti/']").first();
    await expect(link.locator(".ascuns")).toHaveCount(1);
  });

  test("fără modul filmare nu se blurează nimic", async ({ page, context }) => {
    await context.clearCookies({ name: "crm_filmare" });
    await intraCa(page, "admin");
    await page.goto("/lead-uri");
    const ascuns = page.locator("tbody .ascuns").first();
    expect(await filtru(ascuns)).toBe("none");
  });
});
