import { expect, test, type Page } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, punePeProiect, stergeLead, ziPeste } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});
const client = async (pret: number | null = 2000) => {
  const c = await clientNou();
  deSters.push(c.leadId);
  if (pret !== null) await db().from("proiecte").update({ pret_lei: pret }).eq("id", c.proiectId);
  return c;
};

async function transa(proiectId: string, d: { suma?: number; scadenta?: string; eticheta?: string; tip?: "odata" | "avans" | "rata" } = {}) {
  const { data, error } = await db()
    .from("transe")
    .insert({ proiect_id: proiectId, tip: d.tip ?? "avans", eticheta: d.eticheta ?? "Avans", suma_lei: d.suma ?? 2000, scadenta: d.scadenta ?? ziPeste(0) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function deschideFinante(page: Page, clientId: string) {
  await page.goto(`/clienti/${clientId}`);
  await page.getByRole("tab", { name: /^Finanțe/ }).click();
  return page.getByTestId("finante");
}

test("planul în 4 rate face 4 tranșe și scrie «4 rate lunare»", async ({ page }) => {
  const c = await client(6000);
  await intraCa(page, "admin");
  const f = await deschideFinante(page, c.clientId);
  await expect(f).toContainText("Proiectul n-are încă un plan de plată.");
  await f.getByRole("button", { name: "Rate", exact: true }).click();
  await f.getByLabel("Câte rate").fill("4");
  await f.getByLabel("Prima rată").fill(ziPeste(5));
  await f.getByRole("button", { name: "Salvează planul" }).click();
  await expect(f.getByTestId("transa")).toHaveCount(4);
  await expect(f.getByTestId("transa").first()).toContainText("Rata 1 din 4 · 1.500 lei");
  await expect(page.getByTestId("proiect")).toContainText("4 rate lunare");
});

test("«Am încasat» cu suma întreagă: tranșa devine încasată, Încasat crește, sub ea apare comisionul lui Radu", async ({ page }) => {
  const c = await client(2000);
  await punePeProiect(c.proiectId, "constructor", 30);
  await transa(c.proiectId);
  await intraCa(page, "admin");
  const f = await deschideFinante(page, c.clientId);
  const card = f.getByTestId("transa").first();
  await card.getByRole("button", { name: "Am încasat" }).click();
  await expect(card.getByLabel("Suma încasată (lei)")).toHaveValue("2000");
  await card.getByRole("button", { name: "Încasează" }).click();
  await expect(card).toContainText("Încasată");
  await expect(card).toContainText("Radu Stan");
  await expect(card).toContainText("600 lei");
  await expect(card.getByRole("button", { name: "De plătit" })).toBeVisible();
  await expect(page.getByTestId("proiect")).toContainText("2.000 lei");
});

test("plata parțială lasă un rest «· rest» cu aceeași dată", async ({ page }) => {
  const c = await client(2000);
  await transa(c.proiectId, { scadenta: ziPeste(4) });
  await intraCa(page, "admin");
  const f = await deschideFinante(page, c.clientId);
  const card = f.getByTestId("transa").first();
  await card.getByRole("button", { name: "Am încasat" }).click();
  await card.getByLabel("Suma încasată (lei)").fill("1200");
  await card.getByRole("button", { name: "Încasează" }).click();
  await expect(f.getByTestId("transa")).toHaveCount(2);
  await expect(f.getByTestId("transa").filter({ hasText: "Avans · rest" })).toContainText("800 lei");
});

test("plata mai mare cere confirmare", async ({ page }) => {
  const c = await client(2000);
  await transa(c.proiectId);
  await intraCa(page, "admin");
  const f = await deschideFinante(page, c.clientId);
  const card = f.getByTestId("transa").first();
  await card.getByRole("button", { name: "Am încasat" }).click();
  await card.getByLabel("Suma încasată (lei)").fill("2500");
  await card.getByRole("button", { name: "Încasează" }).click();
  await expect(card).toContainText("Suma e mai mare decât tranșa.");
  await card.getByRole("button", { name: "Da, încasez 2.500 lei" }).click();
  await expect(card).toContainText("Încasată");
});

test("tranșa întârziată arată chipul roșu în capul fișei și cardul «Rată întârziată»", async ({ page }) => {
  const c = await client(2000);
  await transa(c.proiectId, { scadenta: ziPeste(-3) });
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await expect(page.getByTestId("chip-intarziere")).toHaveText("Rată întârziată");
  await expect(page.getByTestId("rata-intarziata")).toContainText("întârzie de 3 zile");
  await page.getByRole("tab", { name: /^Finanțe/ }).click();
  await expect(page.getByTestId("transa").first()).toContainText("Întârzie 3 zile");
  await expect(page.getByTestId("transa").first().getByRole("button", { name: "Am încasat-o" })).toBeVisible();
});

test("bulina «De plătit» devine «Plătit <data>» și se poate anula", async ({ page }) => {
  const c = await client(2000);
  await punePeProiect(c.proiectId, "constructor", 30);
  const t = await transa(c.proiectId);
  const r = await db().rpc("incaseaza", { t, suma: 2000, zi: ziPeste(0), peste: false });
  expect(r.error).toBeNull();
  await intraCa(page, "admin");
  const f = await deschideFinante(page, c.clientId);
  await f.getByRole("button", { name: "De plătit" }).click();
  await expect(f.getByRole("button", { name: /^Plătit / })).toBeVisible();
  await f.getByRole("button", { name: /^Plătit / }).click();
  await expect(f.getByRole("button", { name: "De plătit" })).toBeVisible();
});

test("constructorul nu vede tab-ul Finanțe și nici Încasat; vede «Comisionul tău»", async ({ page }) => {
  const c = await client(2400);
  await punePeProiect(c.proiectId, "constructor", 30);
  const t = await transa(c.proiectId, { suma: 1200 });
  await db().rpc("incaseaza", { t, suma: 1200, zi: ziPeste(0), peste: false });
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  await expect(page.getByRole("tab", { name: /^Finanțe/ })).toHaveCount(0);
  const proiect = page.getByTestId("proiect");
  await expect(proiect).toContainText("2.400 lei");
  await expect(proiect).not.toContainText("Încasat");
  await expect(proiect).toContainText("0 lei primiți · 360 lei de primit");
  await expect(page.getByTestId("chip-intarziere")).toHaveCount(0);
});

test("procentul de bază completează procentul constructorului adăugat", async ({ page }) => {
  await db().from("procente_baza").update({ procent: 25 }).eq("categorie", "site").eq("rol", "constructor");
  try {
    const c = await client(2000);
    await intraCa(page, "admin");
    await page.goto(`/clienti/${c.clientId}`);
    const proiect = page.getByTestId("proiect");
    await proiect.getByLabel("Adaugă un om").selectOption({ label: "Radu Stan" });
    await expect(proiect.getByLabel("Procent")).toHaveValue("25");
  } finally {
    await db().from("procente_baza").update({ procent: null }).eq("categorie", "site").eq("rol", "constructor");
  }
});
