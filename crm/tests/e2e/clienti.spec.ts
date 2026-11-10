import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, punePeProiect, stergeLead, ziPeste } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});
const client = async (...a: Parameters<typeof clientNou>) => {
  const c = await clientNou(...a);
  deSters.push(c.leadId);
  return c;
};

test("adminul completează proiectul: preț, încasat, termen, apoi schimbă stadiul", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto("/clienti");
  const rand = page.getByRole("row").filter({ hasText: c.nume });
  await expect(rand.getByText("Discuție")).toBeVisible();
  await rand.getByRole("link", { name: c.nume }).click();
  await expect(page).toHaveURL(new RegExp(`/clienti/${c.clientId}`));
  await expect(page.getByRole("heading", { name: c.nume })).toBeVisible();
  await expect(page.getByTestId("urmeaza")).toContainText("Niciun task încă.");

  const proiect = page.getByTestId("proiect");
  await proiect.getByRole("button", { name: "Schimbă" }).click();
  await proiect.getByLabel("Preț (lei)").fill("2400");
  await proiect.getByLabel("Încasat (lei)").fill("1.200");
  await proiect.getByLabel("Termen de predare").fill(ziPeste(10));
  await proiect.getByRole("button", { name: "Salvează" }).click();
  await expect(proiect).toContainText("2.400 lei");
  await expect(proiect).toContainText("1.200 lei");

  await proiect.getByLabel("Stadiu").selectOption({ label: "Schiță" });
  await expect(page.getByTestId("parcurs")).toContainText("Stadiu: Discuție → Schiță");
  const { data } = await db().from("proiecte").select("pret_lei, incasat_lei, termen, stadiu").eq("id", c.proiectId).single();
  expect(data).toEqual({ pret_lei: 2400, incasat_lei: 1200, termen: ziPeste(10), stadiu: "schita" });
});

test("adminul pune un constructor pe proiect; constructorul își vede prețul și comisionul, nimic de schimbat", async ({ page }) => {
  const c = await client();
  await db().from("proiecte").update({ pret_lei: 2400, incasat_lei: 1200 }).eq("id", c.proiectId);
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  const proiect = page.getByTestId("proiect");
  await proiect.getByLabel("Adaugă un om").selectOption({ label: "Radu Stan" });
  await proiect.getByLabel("Procent").fill("30");
  await proiect.getByRole("button", { name: "Adaugă" }).click();
  await expect(proiect.getByTestId("lucreaza")).toContainText("Radu Stan");
  await expect(proiect.getByTestId("lucreaza")).toContainText("30%");
  await expect(page.getByTestId("parcurs")).toContainText("Radu Stan adăugat în proiect");

  await page.context().clearCookies();
  await intraCa(page, "constructor");
  await page.goto("/clienti");
  await page.getByRole("row").filter({ hasText: c.nume }).getByRole("link", { name: c.nume }).click();
  const alLui = page.getByTestId("proiect");
  await expect(alLui).toContainText("2.400 lei");
  await expect(alLui).toContainText("30% · 360 lei din ce s-a încasat");
  await expect(page.getByRole("button", { name: "Schimbă" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Scoate" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Fișa de lead →" })).toHaveCount(0);
});

test("constructorul fără procent vede „nestabilit încă”", async ({ page }) => {
  const c = await client();
  await punePeProiect(c.proiectId, "constructor");
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  await expect(page.getByTestId("proiect")).toContainText("nestabilit încă");
});

test("cine n-are voie: constructorul din afara proiectului primește 404, callerul ajunge la lead-uri", async ({ page }) => {
  const c = await client();
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  await expect(page.getByRole("heading", { name: c.nume })).toHaveCount(0);
  await expect(page.getByText("404")).toBeVisible();

  await page.context().clearCookies();
  await intraCa(page, "caller");
  await page.goto(`/clienti/${c.clientId}`);
  await expect(page).toHaveURL(/\/lead-uri$/);
});

test("preț scris greșit → mesaj, iar prețul rămâne necompletat", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  const proiect = page.getByTestId("proiect");
  await proiect.getByRole("button", { name: "Schimbă" }).click();
  await proiect.getByLabel("Preț (lei)").fill("abc");
  await proiect.getByRole("button", { name: "Salvează" }).click();
  await expect(proiect.getByText("Scrie suma în lei, fără zecimale.")).toBeVisible();
  const { data } = await db().from("proiecte").select("pret_lei").eq("id", c.proiectId).single();
  expect(data?.pret_lei).toBeNull();
});

test("adminul schimbă telefonul clientului", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  const contact = page.getByTestId("contact");
  await contact.getByRole("button", { name: "Schimbă" }).click();
  await contact.getByLabel("Telefon").fill("0733 111 222");
  await contact.getByRole("button", { name: "Salvează" }).click();
  await expect(contact).toContainText("0733 111 222");
  await expect(contact.getByRole("link", { name: "deschide →" })).toHaveAttribute("href", "https://wa.me/40733111222");
});

test("din fișa de lead a unui client, adminul ajunge la fișa clientului", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/lead-uri/${c.leadId}`);
  await expect(page.getByTestId("urmeaza")).toContainText("E client.");
  await page.getByRole("link", { name: "Deschide fișa clientului →" }).click();
  await expect(page).toHaveURL(new RegExp(`/clienti/${c.clientId}$`));
});
