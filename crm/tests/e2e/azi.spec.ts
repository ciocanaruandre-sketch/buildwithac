import { expect, test, type Page } from "@playwright/test";
import { intraCa, type Cont } from "./ajutor";
import { clientNou, db, idDe, leadNou, punePeProiect, stergeLead, ziPeste } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});
const lead = async (camp: Parameters<typeof leadNou>[0] = {}) => {
  const l = await leadNou(camp);
  deSters.push(l.id);
  return l;
};
const client = async () => {
  const c = await clientNou();
  deSters.push(c.leadId);
  return c;
};

const placile = (page: Page) => page.getByRole("button", { name: /^(De sunat|Discuții|Lucru|Bani) \d+$/ });
const numePlaci = async (page: Page) => (await placile(page).allTextContents()).map((t) => t.match(/De sunat|Discuții|Lucru|Bani/)![0]);
const randuri = (page: Page) => page.getByTestId("rand-azi");
const acum = (page: Page) => page.getByTestId("acum");

test("„/” duce la „/azi” la toate rolurile", async ({ page }) => {
  for (const cont of ["admin", "caller", "closer", "constructor"] as Cont[]) {
    await page.context().clearCookies();
    await intraCa(page, cont);
    await page.goto("/");
    await expect(page).toHaveURL(/\/azi$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Bună (dimineața|ziua|seara), /);
    await expect(page.getByRole("navigation", { name: "Navigare" }).first().getByRole("link").first()).toHaveText("Azi");
  }
});

test("callerul vede doar „De sunat”: lead-ul lui și cel liber, nu și pe al lui Vlad", async ({ page }) => {
  const [mara, vlad] = await Promise.all([idDe("caller"), idDe("caller2")]);
  const alMarei = await lead({ caller_id: mara });
  const liber = await lead({ caller_id: null });
  const alLuiVlad = await lead({ caller_id: vlad });
  await intraCa(page, "caller");
  await expect(acum(page)).toBeVisible();
  expect(await numePlaci(page)).toEqual(["De sunat"]);
  await expect(randuri(page).filter({ hasText: alMarei.nume })).toHaveCount(1);
  await expect(randuri(page).filter({ hasText: liber.nume })).toHaveCount(1);
  await expect(page.getByText(alLuiVlad.nume)).toHaveCount(0);
});

test("constructorul vede doar „Lucru”, cu task-ul lui întârziat", async ({ page }) => {
  const c = await client();
  await punePeProiect(c.proiectId, "constructor", 30);
  const { error } = await db().from("taskuri").insert({ proiect_id: c.proiectId, titlu: "E2E pagina de meniu", om_id: await idDe("constructor"), termen: ziPeste(-2) });
  if (error) throw error;
  await intraCa(page, "constructor");
  expect(await numePlaci(page)).toEqual(["Lucru"]);
  const r = randuri(page).filter({ hasText: "E2E pagina de meniu" });
  await expect(r).toContainText("întârziat 2 zile");
  await expect(page.getByRole("button", { name: /^Bani/ })).toHaveCount(0);
});

test("adminul vede „Bani”, cu rata întârziată „întârzie 3 zile”", async ({ page }) => {
  const c = await client();
  const { error } = await db().from("transe").insert({ proiect_id: c.proiectId, tip: "extra", eticheta: "E2E rată", suma_lei: 777, scadenta: ziPeste(-3) });
  if (error) throw error;
  await intraCa(page, "admin");
  await page.getByRole("button", { name: /^Bani \d+$/ }).click();
  await expect(page.getByRole("button", { name: /^Bani \d+$/ })).toHaveAttribute("aria-pressed", "true");
  const r = randuri(page).filter({ hasText: "E2E rată" });
  await expect(r).toContainText("întârzie 3 zile");
  await expect(r).toContainText("777 lei");
  await expect(r).toContainText(c.nume);
});

test("„Acum” arată cel mai vechi lead întârziat al callerului", async ({ page }) => {
  const mara = await idDe("caller");
  const primul = await lead({ caller_id: mara, intrat_la: "2020-01-01T09:00:00Z" });
  await lead({ caller_id: mara, intrat_la: "2020-01-02T09:00:00Z" });
  await intraCa(page, "caller");
  await expect(acum(page)).toContainText(primul.nume);
  await expect(acum(page)).toContainText("Lead nou");
});
