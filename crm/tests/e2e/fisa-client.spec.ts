import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, punePeProiect, stergeLead } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});
/** Un client nou, cu Radu Stan (constructorul de test) pe proiect. */
const client = async () => {
  const c = await clientNou();
  deSters.push(c.leadId);
  await punePeProiect(c.proiectId, "constructor", 30);
  return c;
};

test("constructorul scrie o notiță; apare cu numele lui, iar „Șterge” îl are doar Adminul", async ({ page }) => {
  const c = await client();
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Notițe" }).click();
  const notite = page.getByTestId("notite");
  await notite.getByLabel("Notiță nouă").fill("Vrea meniul pe categorii.");
  await notite.getByRole("button", { name: "Adaugă notița" }).click();
  await expect(notite.getByText("Vrea meniul pe categorii.")).toBeVisible();
  await expect(notite.getByText("Radu Stan")).toBeVisible();
  await expect(notite.getByRole("button", { name: "Șterge" })).toHaveCount(0);

  await page.context().clearCookies();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Notițe" }).click();
  await page.getByTestId("notite").getByRole("button", { name: "Șterge" }).click();
  await page.getByTestId("notite").getByRole("button", { name: "Sigur?" }).click();
  await expect(page.getByTestId("notite").getByText("Vrea meniul pe categorii.")).toHaveCount(0);
});

test("livrarea: Trimis → Aprobat, cu amândouă în Parcurs", async ({ page }) => {
  const c = await client();
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Livrat" }).click();
  const livrari = page.getByTestId("livrari");
  await livrari.getByLabel("Ce i-ai trimis").fill("Schița paginii principale (v2)");
  await livrari.getByLabel("Link").fill("https://exemplu.ro/schita-v2");
  await livrari.getByLabel("Notă").fill("Aștept răspuns până vineri.");
  await livrari.getByRole("button", { name: "Adaugă" }).click();

  const rand = livrari.getByRole("listitem").filter({ hasText: "Schița paginii principale (v2)" });
  await expect(rand.getByTestId("stare-livrare")).toHaveText("Trimis");
  await expect(rand.getByRole("link", { name: "Schița paginii principale (v2)" })).toHaveAttribute("href", "https://exemplu.ro/schita-v2");
  await expect(rand).toContainText("Aștept răspuns până vineri.");

  await rand.getByLabel("Starea livrării").selectOption({ label: "Aprobat" });
  await expect(rand.getByTestId("stare-livrare")).toHaveText("Aprobat");

  await page.getByRole("tab", { name: "Parcurs" }).click();
  const parcurs = page.getByTestId("parcurs");
  await expect(parcurs).toContainText("Trimis clientului: Schița paginii principale (v2)");
  await expect(parcurs).toContainText("Schița paginii principale (v2): Aprobat");
});

test("link care nu e http(s) → mesaj, nimic adăugat", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Livrat" }).click();
  const livrari = page.getByTestId("livrari");
  await livrari.getByLabel("Ce i-ai trimis").fill("Previzualizare");
  await livrari.getByLabel("Link").fill("ftp://x");
  await livrari.getByRole("button", { name: "Adaugă" }).click();
  await expect(livrari.getByText("Linkul trebuie să înceapă cu https://")).toBeVisible();
  const { data } = await db().from("livrari").select("id").eq("proiect_id", c.proiectId);
  expect(data).toEqual([]);
});
