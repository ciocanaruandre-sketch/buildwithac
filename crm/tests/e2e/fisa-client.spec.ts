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

test("conturile: rândul apare, iar avertismentul despre parole e mereu pe ecran", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Conturi" }).click();
  const conturi = page.getByTestId("conturi");
  await expect(conturi.getByText("Parolele nu stau în CRM. Aici scrii doar ce cont e, al cui e și unde e parola.")).toBeVisible();
  await conturi.getByLabel("Serviciu").fill("Domeniu (ROTLD)");
  await conturi.getByLabel("Cont", { exact: true }).fill("cafeneauacolt.ro");
  await conturi.getByLabel("Al cui").selectOption({ label: "al clientului" });
  await conturi.getByLabel("Unde e parola").selectOption({ label: "la client" });
  await conturi.getByRole("button", { name: "Adaugă contul" }).click();

  const rand = conturi.getByRole("row").filter({ hasText: "Domeniu (ROTLD)" });
  await expect(rand).toContainText("cafeneauacolt.ro");
  await expect(rand).toContainText("al clientului");
  await expect(rand).toContainText("la client");
  await expect(conturi.getByText("Parolele nu stau în CRM.")).toBeVisible();
  const { data } = await db().from("conturi").select("serviciu, cont, al_cui, unde_parola").eq("proiect_id", c.proiectId);
  expect(data).toEqual([{ serviciu: "Domeniu (ROTLD)", cont: "cafeneauacolt.ro", al_cui: "client", unde_parola: "la_client" }]);
});

test("materialele: un link se adaugă, se deschide în filă nouă și se șterge", async ({ page }) => {
  const c = await client();
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Materiale" }).click();
  const materiale = page.getByTestId("materiale");
  await materiale.getByLabel("Titlu").fill("Logo și culori");
  await materiale.getByLabel("Link").fill("https://drive.google.com/drive/folders/exemplu");
  await materiale.getByLabel("Notă").fill("de la client, pe Drive");
  await materiale.getByRole("button", { name: "Adaugă link-ul" }).click();

  const rand = materiale.getByRole("listitem").filter({ hasText: "Logo și culori" });
  await expect(rand).toContainText("de la client, pe Drive");
  await expect(rand).toContainText("Radu Stan");
  const deschide = rand.getByRole("link", { name: "deschide" });
  await expect(deschide).toHaveAttribute("href", "https://drive.google.com/drive/folders/exemplu");
  await expect(deschide).toHaveAttribute("target", "_blank");

  await rand.getByRole("button", { name: "Șterge" }).click();
  await rand.getByRole("button", { name: "Sigur?" }).click();
  await expect(materiale.getByText("Logo și culori")).toHaveCount(0);
});

test("material cu link greșit → mesaj", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Materiale" }).click();
  const materiale = page.getByTestId("materiale");
  await materiale.getByLabel("Titlu").fill("Poze");
  await materiale.getByLabel("Link").fill("drive.google.com/x");
  await materiale.getByRole("button", { name: "Adaugă link-ul" }).click();
  await expect(materiale.getByText("Linkul trebuie să înceapă cu https://")).toBeVisible();
});
