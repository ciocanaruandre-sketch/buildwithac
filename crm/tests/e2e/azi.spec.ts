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

test.describe("acțiunile de pe „Azi”", () => {
  /** Două lead-uri ale Marei din 2020: primele în ordine, înaintea oricărui lead demo. */
  const doiVechi = async () => {
    const mara = await idDe("caller");
    const a = await lead({ caller_id: mara, intrat_la: "2020-01-01T09:00:00Z" });
    const b = await lead({ caller_id: mara, intrat_la: "2020-01-02T09:00:00Z" });
    return { mara, a, b };
  };
  const stare = async (id: string) => (await db().from("lead_uri").select("stare, incercari, caller_id").eq("id", id).single()).data!;

  test("„Mai târziu” trece la următorul lead", async ({ page }) => {
    const { a, b } = await doiVechi();
    await intraCa(page, "caller");
    await expect(acum(page)).toContainText(a.nume);
    await acum(page).getByRole("button", { name: "Mai târziu" }).click();
    await expect(acum(page)).toContainText(b.nume);
    await expect(acum(page)).not.toContainText(a.nume);
  });

  test("„Treci rezultatul” → „Nu răspunde” salvează și „Acum” trece la următorul", async ({ page }) => {
    const { a, b } = await doiVechi();
    await intraCa(page, "caller");
    await acum(page).getByRole("button", { name: "Treci rezultatul" }).click();
    await acum(page).getByRole("button", { name: "Nu răspunde" }).click();
    await expect(acum(page)).toContainText(b.nume);
    await expect.poll(async () => (await stare(a.id)).stare).toBe("fara_raspuns");
    expect((await stare(a.id)).incercari).toBe(1);
  });

  test("„Sună” are href-ul tel:+40… și, apăsat, deschide butoanele de rezultat", async ({ page }) => {
    const { a } = await doiVechi();
    await intraCa(page, "caller");
    const suna = acum(page).getByRole("link", { name: "Sună", exact: true });
    await expect(suna).toHaveAttribute("href", `tel:+${a.telefon_norm}`);
    await expect(acum(page).getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", `https://wa.me/${a.telefon_norm}`);
    await suna.click();
    await expect(acum(page).getByRole("button", { name: "Nu răspunde" })).toBeVisible();
  });

  test("„Sună” pe un rând din listă îl aduce în „Acum”", async ({ page }) => {
    const { b } = await doiVechi();
    await intraCa(page, "caller");
    await randuri(page).filter({ hasText: b.nume }).getByRole("link", { name: "Sună", exact: true }).click();
    await expect(acum(page)).toContainText(b.nume);
    await expect(acum(page).getByRole("button", { name: "Nu răspunde" })).toBeVisible();
  });

  test("„Ia lead-ul și sună” preia lead-ul liber", async ({ page }) => {
    const mara = await idDe("caller");
    const liber = await lead({ caller_id: null, intrat_la: "2019-12-31T09:00:00Z" });
    await intraCa(page, "caller");
    await expect(acum(page)).toContainText(liber.nume);
    await acum(page).getByRole("button", { name: "Ia lead-ul și sună" }).click();
    await expect.poll(async () => (await stare(liber.id)).caller_id).toBe(mara);
    await expect(acum(page).getByRole("button", { name: "Nu răspunde" })).toBeVisible();
  });

  test("lead luat între timp: „L-a luat deja Vlad Petrescu.”", async ({ page }) => {
    const liber = await lead({ caller_id: null, intrat_la: "2019-12-31T09:00:00Z" });
    await intraCa(page, "caller");
    await expect(acum(page)).toContainText(liber.nume);
    await db().from("lead_uri").update({ caller_id: await idDe("caller2") }).eq("id", liber.id);
    await acum(page).getByRole("button", { name: "Ia lead-ul și sună" }).click();
    await expect(acum(page).getByRole("alert")).toHaveText("L-a luat deja Vlad Petrescu.");
    await expect(acum(page).getByRole("button", { name: "Nu răspunde" })).toHaveCount(0);
  });

  test("lead fără telefon: fără „Sună”, dar cu „Treci rezultatul”", async ({ page }) => {
    const mara = await idDe("caller");
    const fara = await lead({ caller_id: mara, intrat_la: "2019-12-30T09:00:00Z", telefon: null, telefon_norm: null, email: `e2e-${Date.now()}@test.buildwithac.ro`, email_norm: `e2e-${Date.now()}@test.buildwithac.ro` });
    await intraCa(page, "caller");
    await expect(acum(page)).toContainText(fara.nume);
    await expect(acum(page).getByRole("link", { name: "Sună", exact: true })).toHaveCount(0);
    await acum(page).getByRole("button", { name: "Treci rezultatul" }).click();
    await expect(acum(page).getByRole("button", { name: "Nu răspunde" })).toBeVisible();
  });

  test("constructorul bifează „✓ Gata” și task-ul dispare", async ({ page }) => {
    const c = await client();
    await punePeProiect(c.proiectId, "constructor", 30);
    const { data, error } = await db().from("taskuri").insert({ proiect_id: c.proiectId, titlu: "E2E de bifat", om_id: await idDe("constructor"), termen: ziPeste(0) }).select("id").single();
    if (error) throw error;
    await intraCa(page, "constructor");
    await randuri(page).filter({ hasText: "E2E de bifat" }).getByRole("button", { name: "✓ Gata" }).click();
    await expect(randuri(page).filter({ hasText: "E2E de bifat" })).toHaveCount(0);
    expect((await db().from("taskuri").select("gata").eq("id", data.id).single()).data!.gata).toBe(true);
  });
});
