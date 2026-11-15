import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { idDe } from "./date";

test("Adminul vede cele 5 cifre și echipa", async ({ page }) => {
  await intraCa(page, "admin");
  await page.goto("/kpi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("KPI");
  const sus = page.getByTestId("cifre-cheie");
  for (const t of ["Lead-uri noi", "Clienți noi", "Timp până la primul apel", "Rata de prezentare", "Încasat"]) await expect(sus.getByText(t, { exact: true })).toBeVisible();
  await expect(page.getByText("Echipa · dă clic pe un om")).toBeVisible();
  for (const t of ["De la lead la client", "Apeluri", "Închideri", "Pierderi și surse", "Proiecte", "Bani"]) await expect(page.getByRole("heading", { name: t, exact: true })).toBeVisible();
});

test("clic pe un om îi deschide panoul, al doilea clic îl închide", async ({ page }) => {
  await intraCa(page, "admin");
  await page.goto("/kpi");
  const mara = page.getByTestId("card-om").filter({ hasText: "Mara Ionescu" });
  await mara.click();
  await expect(page).toHaveURL(new RegExp(`om=${await idDe("caller")}`));
  await expect(page.getByTestId("panou-om")).toContainText("Mara Ionescu");
  await page.getByTestId("card-om").filter({ hasText: "Mara Ionescu" }).click();
  await expect(page).not.toHaveURL(/om=/);
  await expect(page.getByTestId("panou-om")).toHaveCount(0);
});

test("schimbarea perioadei", async ({ page }) => {
  await intraCa(page, "admin");
  await page.goto("/kpi");
  await expect(page.getByText("Săgețile: față de luna trecută.")).toBeVisible();
  await page.getByRole("link", { name: "Săptămâna asta" }).click();
  await expect(page).toHaveURL(/p=sapt/);
  await expect(page.getByText("Săgețile: față de săptămâna trecută.")).toBeVisible();
});

test("callerul vede doar Apelurile mele", async ({ page }) => {
  await intraCa(page, "caller");
  await page.goto("/kpi");
  await expect(page.getByRole("heading", { name: "Apelurile mele" })).toBeVisible();
  await expect(page.getByText("Cifrele tale. Le vezi doar tu și Adminul.")).toBeVisible();
  const main = page.getByRole("main");
  for (const t of ["Bani", "Echipa · dă clic pe un om", "De la lead la client"]) await expect(main.getByText(t, { exact: true })).toHaveCount(0);
  await expect(main.getByText(/lei/)).toHaveCount(0);
});

test("closerul nu vede lei", async ({ page }) => {
  await intraCa(page, "closer");
  await page.goto("/kpi");
  await expect(page.getByRole("heading", { name: "Discuțiile mele" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "De ce pierd" })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByText("Vândut")).toHaveCount(0);
  await expect(main.getByText(/lei/)).toHaveCount(0);
});

test("?om= străin la caller e ignorat", async ({ page }) => {
  await intraCa(page, "caller");
  await page.goto(`/kpi?om=${await idDe("closer")}`);
  await expect(page.getByTestId("panou-om")).toHaveCount(0);
  await expect(page.getByRole("main").getByText("Ioana Dumitru")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Apelurile mele" })).toBeVisible();
});

test("la 390px pagina nu derulează pe orizontală, iar meniul de jos are KPI", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  await page.goto("/kpi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("KPI");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true }).getByRole("link", { name: "KPI" })).toBeVisible();
});
