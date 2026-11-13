import { expect, test, type Page } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, idDe, punePeProiect, stergeLead, ziPeste } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});

// sume mari: pe baza de test rămân comisioane fără proiect, de la alte teste, care se adună la totalurile oamenilor
const client = async () => {
  const c = await clientNou();
  deSters.push(c.leadId);
  await db().from("proiecte").update({ pret_lei: 9_000_000 }).eq("id", c.proiectId);
  return c;
};

async function transa(proiectId: string, d: { suma?: number; scadenta?: string; eticheta?: string } = {}) {
  const { data, error } = await db()
    .from("transe")
    .insert({ proiect_id: proiectId, tip: "avans", eticheta: d.eticheta ?? "Avans", suma_lei: d.suma ?? 1_234_000, scadenta: d.scadenta ?? ziPeste(0) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

const coloana = (page: Page, cheie: "intarzie" | "urmeaza" | "incasate") => page.getByTestId(`coloana-${cheie}`);
const card = (page: Page, cheie: "intarzie" | "urmeaza" | "incasate", nume: string) => coloana(page, cheie).getByTestId("card-transa").filter({ hasText: nume });

test("Admin: o tranșă întârziată apare în «Întârzie», cu zilele; «✓ Am încasat» o mută în «Încasate»", async ({ page }) => {
  const c = await client();
  await transa(c.proiectId, { scadenta: ziPeste(-5), eticheta: "Rata 3 din 4" });
  await intraCa(page, "admin");
  await page.goto("/finante");
  const k = card(page, "intarzie", c.nume);
  await expect(k).toContainText("Rata 3 din 4");
  await expect(k).toContainText("5 zile");
  await expect(k).toContainText("1.234.000");
  await k.getByRole("button", { name: "✓ Am încasat" }).click();
  // butonul nu deschide fișa: rămânem pe Finanțe
  await expect(page).toHaveURL(/\/finante$/);
  await k.getByRole("button", { name: "Încasează" }).click();
  await expect(card(page, "incasate", c.nume)).toContainText("Rata 3 din 4");
  await expect(card(page, "intarzie", c.nume)).toHaveCount(0);
});

test("Admin: o tranșă peste 10 zile e în «Urmează · 30 de zile»; apăsarea pe card deschide fișa", async ({ page }) => {
  const c = await client();
  await transa(c.proiectId, { scadenta: ziPeste(10), eticheta: "Restul" });
  await intraCa(page, "admin");
  await page.goto("/finante");
  await expect(coloana(page, "urmeaza")).toContainText("Urmează · 30 de zile");
  const k = card(page, "urmeaza", c.nume);
  await expect(k).toContainText("Restul");
  await expect(card(page, "intarzie", c.nume)).toHaveCount(0);
  await k.getByText("Restul").click();
  await expect(page).toHaveURL(new RegExp(`/clienti/${c.clientId}\\?proiect=${c.proiectId}$`));
});

test("Admin: «Am plătit tot» bifează comisioanele omului", async ({ page }) => {
  const c = await client();
  await punePeProiect(c.proiectId, "constructor", 30);
  const t = await transa(c.proiectId);
  const { error } = await db().rpc("incaseaza", { t, suma: 1_234_000, zi: ziPeste(0), peste: false });
  if (error) throw error;
  await intraCa(page, "admin");
  await page.goto("/finante");
  await page.getByRole("tab", { name: /^De plătit echipei/ }).click();
  const radu = page.getByTestId("de-platit-om").filter({ hasText: "Radu Stan" });
  await expect(radu).toContainText(`${c.nume} · Avans (30%)`);
  await expect(radu).toContainText("370.200 lei");
  await radu.getByRole("button", { name: "Am plătit tot" }).click();
  await expect(page.getByTestId("de-platit-om").filter({ hasText: c.nume })).toHaveCount(0);
  const { data } = await db().from("comisioane").select("platit_la").eq("proiect_id", c.proiectId).eq("om_id", await idDe("constructor"));
  expect(data?.[0]?.platit_la).toBe(ziPeste(0));
});

test.describe("procentele de bază", () => {
  let inainte: number | null = null;
  test.beforeEach(async () => {
    const { data } = await db().from("procente_baza").select("procent").eq("categorie", "altceva").eq("rol", "closer").single();
    inainte = data?.procent ?? null;
  });
  test.afterEach(async () => {
    await db().from("procente_baza").update({ procent: inainte }).eq("categorie", "altceva").eq("rol", "closer");
  });

  test("Admin: procentul de bază se salvează", async ({ page }) => {
    await intraCa(page, "admin");
    await page.goto("/finante");
    await page.getByRole("tab", { name: "Procente de bază" }).click();
    const camp = page.getByLabel("Altceva, Closer");
    const nou = inainte === 12.5 ? "13" : "12,5";
    await camp.fill(nou);
    await camp.blur();
    await expect(page.getByTestId("procente-salvat")).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "Procente de bază" }).click();
    await expect(page.getByLabel("Altceva, Closer")).toHaveValue(nou);
  });
});

test("390px: meniul de jos are 7 intrări vizibile și pagina nu se derulează pe orizontală", async ({ page }) => {
  const c = await client();
  await transa(c.proiectId, { scadenta: ziPeste(-3) });
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  for (const cale of ["/finante", "/clienti", `/clienti/${c.clientId}`]) {
    await page.goto(cale);
    await expect(page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true }).getByRole("link")).toHaveCount(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await expect(page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true }).getByRole("link", { name: "Finanțe" })).toBeVisible();
});

test("modul filmare: numele clienților de pe Finanțe sunt blurate", async ({ page, context }) => {
  const c = await client();
  await transa(c.proiectId, { scadenta: ziPeste(-2) });
  await context.addCookies([{ name: "crm_filmare", value: "1", url: "http://localhost:3100" }]);
  await intraCa(page, "admin");
  await page.goto("/finante");
  const nume = card(page, "intarzie", c.nume).locator(".ascuns");
  await expect(nume).toHaveText(c.nume);
  const raza = Number(/blur\(([\d.]+)px\)/.exec(await nume.evaluate((e) => getComputedStyle(e).filter))?.[1] ?? 0);
  expect(raza).toBeGreaterThanOrEqual(4);
});

test.describe("pagina oamenilor din echipă", () => {
  // un proiect cu Radu (30%) și Mara (10%), o tranșă încasată și una întârziată
  async function proiectCuOameni() {
    const c = await client();
    await punePeProiect(c.proiectId, "constructor", 30);
    const v = await db().from("proiect_vanzari").insert({ proiect_id: c.proiectId, om_id: await idDe("caller"), procent: 10 });
    if (v.error) throw v.error;
    const t = await transa(c.proiectId, { eticheta: "Avans" });
    const { error } = await db().rpc("incaseaza", { t, suma: 1_234_000, zi: ziPeste(0), peste: false });
    if (error) throw error;
    await transa(c.proiectId, { eticheta: "Restul", suma: 500_000, scadenta: ziPeste(-5) });
    return c;
  }

  test("Radu își vede comisioanele, nu și ale callerului, și nu vede cuvântul «Întârzie»", async ({ page }) => {
    const c = await proiectCuOameni();
    await intraCa(page, "constructor");
    await page.goto("/finante");
    await expect(page.getByRole("heading", { name: "Finanțe" })).toBeVisible();
    const dePrimit = page.getByTestId("lista-de-primit");
    await expect(dePrimit).toContainText(`${c.nume} · Avans · 30% din 1.234.000 lei`);
    await expect(dePrimit).toContainText("370.200 lei");
    // fără date: grupate pe client, ca omul să nu poată deduce cine întârzie
    const urmeaza = page.getByTestId("lista-urmeaza").getByTestId("grup-urmeaza").filter({ hasText: c.nume });
    await expect(urmeaza).toContainText("Restul · 30% din 500.000 lei");
    await expect(urmeaza).toContainText("150.000 lei");
    await expect(urmeaza).not.toContainText("în așteptare");
    await expect(page.locator("main")).not.toContainText("123.400");
    await expect(page.locator("main")).not.toContainText(/întârz/i);
  });

  test("Mara (caller) vede «Finanțe» în meniu și doar rândurile ei", async ({ page }) => {
    const c = await proiectCuOameni();
    await intraCa(page, "caller");
    await page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true }).getByRole("link", { name: "Finanțe" }).click();
    await expect(page).toHaveURL(/\/finante$/);
    const randuri = page.getByTestId("lista-de-primit").getByTestId("rand-comision").filter({ hasText: c.nume });
    await expect(randuri).toHaveCount(1);
    await expect(randuri).toContainText("10% din 1.234.000 lei");
    await expect(randuri).toContainText("123.400 lei");
    await expect(page.locator("main")).not.toContainText("370.200");
  });
});
