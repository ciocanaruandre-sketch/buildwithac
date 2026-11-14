import { expect, test, type Page } from "@playwright/test";
import { intraCa } from "./ajutor";
import { db, leadNou, stergeLead, ziPeste } from "./date";

const run = Date.now().toString(36);
let k = 0;
/** Un nume de reclamă unic, ca testele să nu se calce între ele. */
const nume = () => `E2E ${run} ${k++}`;
const CAMPANIE = `Test e2e ${run}`;

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});
test.afterAll(async () => {
  await db().from("reclame").delete().eq("campanie", CAMPANIE);
});

async function atribuie(leadId: string, n: string, platforma: "meta" | "tiktok" = "meta") {
  const { data, error } = await db().rpc("atribuie_reclama", { p_lead: leadId, p_platforma: platforma, p_campanie: CAMPANIE, p_nume: n });
  if (error) throw error;
  return data;
}

/** O reclamă cu `lead-uri` lead-uri, dintre care primul devine client cu `incasat` lei încasați. */
async function reclama(o: { lead_uri: number; incasat?: number; cheltuit?: number | null; platforma?: "meta" | "tiktok" }) {
  const n = nume();
  let id = "";
  for (let i = 0; i < o.lead_uri; i++) {
    if (i === 0 && o.incasat) {
      const l = await leadNou({ stare: "programat", sursa: "reclama_meta" });
      deSters.push(l.id);
      id = await atribuie(l.id, n, o.platforma);
      await db().from("lead_uri").update({ stare: "client" }).eq("id", l.id);
      const p = await db().from("proiecte").select("id, clienti!inner (lead_id)").eq("clienti.lead_id", l.id).single();
      const t = await db()
        .from("transe")
        .insert({ proiect_id: p.data!.id, tip: "avans", eticheta: "Avans", suma_lei: o.incasat, scadenta: ziPeste(0), incasata_la: ziPeste(0), incasat_lei: o.incasat });
      if (t.error) throw t.error;
    } else {
      const l = await leadNou({ sursa: "reclama_meta" });
      deSters.push(l.id);
      id = await atribuie(l.id, n, o.platforma);
    }
  }
  if (o.cheltuit !== undefined) await db().from("reclame").update({ cheltuit_lei: o.cheltuit }).eq("id", id);
  return { id, nume: n };
}

const card = (page: Page, n: string) => page.getByTestId("card-reclama").filter({ has: page.getByRole("heading", { name: n, exact: true }) });

test("Admin: cardul arată pâlnia, banii și verdictul", async ({ page }) => {
  const r = await reclama({ lead_uri: 2, incasat: 1000, cheltuit: 100 });
  await intraCa(page, "admin");
  await page.goto("/reclame");
  await expect(page.getByRole("heading", { name: "Reclame", level: 1 })).toBeVisible();
  await expect(page.getByText("Ce reclamă îți aduce clienți și bani")).toBeVisible();
  const c = card(page, r.nume);
  await expect(c).toContainText("Meta");
  await expect(c).toContainText(CAMPANIE);
  await expect(c).toContainText(/Lead-uri\s*2/);
  await expect(c).toContainText(/Discuții\s*1/);
  await expect(c).toContainText(/Clienți\s*1/);
  await expect(c).toContainText("1.000 lei");
  await expect(c).toContainText("+900 lei");
  await expect(c.getByTestId("verdict")).toHaveText("Aduce bani: la 1 leu cheltuit ai încasat 10,0 lei.");
});

test("Admin: scrie suma cheltuită, verdictul se schimbă", async ({ page }) => {
  const r = await reclama({ lead_uri: 1, incasat: 1000 });
  await intraCa(page, "admin");
  await page.goto("/reclame");
  const c = card(page, r.nume);
  await expect(c.getByTestId("verdict")).toHaveText("Scrie cât ai cheltuit ca să vezi dacă merită.");
  await c.getByRole("button", { name: `Cheltuit pe ${r.nume}` }).click();
  await c.getByRole("textbox", { name: `Cheltuit pe ${r.nume} (lei)` }).fill("abc");
  await c.getByRole("textbox", { name: `Cheltuit pe ${r.nume} (lei)` }).press("Enter");
  await expect(c.getByRole("alert")).toHaveText("Scrie suma în lei, fără virgule.");
  await c.getByRole("textbox", { name: `Cheltuit pe ${r.nume} (lei)` }).fill("500");
  await c.getByRole("textbox", { name: `Cheltuit pe ${r.nume} (lei)` }).press("Enter");
  await expect(c.getByTestId("verdict")).toHaveText("Aduce bani: la 1 leu cheltuit ai încasat 2,0 lei.");
  await expect(c.getByRole("button", { name: `Cheltuit pe ${r.nume}` })).toHaveText("500 lei");
});

test("Admin: Escape în câmpul de cheltuit renunță, fără să salveze", async ({ page }) => {
  const r = await reclama({ lead_uri: 1, cheltuit: 100 });
  await intraCa(page, "admin");
  await page.goto("/reclame");
  const c = card(page, r.nume);
  await c.getByRole("button", { name: `Cheltuit pe ${r.nume}` }).click();
  await c.getByRole("textbox", { name: `Cheltuit pe ${r.nume} (lei)` }).fill("999");
  await c.getByRole("textbox", { name: `Cheltuit pe ${r.nume} (lei)` }).press("Escape");
  await expect(c.getByRole("button", { name: `Cheltuit pe ${r.nume}` })).toHaveText("100 lei");
  await page.reload();
  await expect(card(page, r.nume).getByRole("button", { name: `Cheltuit pe ${r.nume}` })).toHaveText("100 lei");
  expect((await db().from("reclame").select("cheltuit_lei").eq("id", r.id).single()).data!.cheltuit_lei).toBe(100);
});

test("Admin: un lead din link de reclamă, dar nelegat, nu apare ca adăugat de mână", async ({ page }) => {
  await reclama({ lead_uri: 1, cheltuit: 100 });
  const l = await leadNou({ sursa: "reclama_meta" });
  deSters.push(l.id);
  const cer = await db()
    .from("cereri")
    .insert({ lead_id: l.id, sursa: "reclama_meta", raspunsuri: [], utm: { utm_source: "ig", utm_medium: "reclama", utm_campaign: CAMPANIE, utm_content: "Nelegată" } });
  if (cer.error) throw cer.error;
  await intraCa(page, "admin");
  await page.goto("/reclame");
  await expect(page.getByTestId("nelegate")).toContainText(/din reclame nu s-a(u)? legat de\s+reclama lor/);
});

test("Admin: + Reclamă adaugă o reclamă fără lead-uri", async ({ page }) => {
  const n = nume();
  await intraCa(page, "admin");
  await page.goto("/reclame");
  await page.getByRole("button", { name: "+ Reclamă" }).click();
  const f = page.getByRole("form", { name: "Reclamă nouă" });
  await f.getByRole("button", { name: "TikTok" }).click();
  await f.getByLabel("Campania").fill(CAMPANIE);
  await f.getByLabel("Numele reclamei").fill(n);
  await f.getByLabel("Cheltuit până acum (lei, opțional)").fill("250");
  await f.getByRole("button", { name: "Adaugă" }).click();
  const c = card(page, n);
  await expect(c).toContainText("TikTok");
  await expect(c.getByTestId("verdict")).toHaveText("Niciun lead încă.");
  await expect(c.getByRole("button", { name: `Cheltuit pe ${n}` })).toHaveText("250 lei");
  // aceeași a doua oară: refuzată
  await page.getByRole("button", { name: "+ Reclamă" }).click();
  await f.getByRole("button", { name: "TikTok" }).click();
  await f.getByLabel("Campania").fill(CAMPANIE);
  await f.getByLabel("Numele reclamei").fill(n);
  await f.getByRole("button", { name: "Adaugă" }).click();
  await expect(f.getByRole("alert")).toHaveText("Reclama asta există deja.");
});

test("Admin: unește două reclame", async ({ page }) => {
  const a = await reclama({ lead_uri: 1, cheltuit: 100 });
  const b = await reclama({ lead_uri: 2, cheltuit: 50 });
  await intraCa(page, "admin");
  await page.goto("/reclame");
  const c = card(page, a.nume);
  await c.getByRole("button", { name: `Mai mult pentru ${a.nume}` }).click();
  await c.getByRole("button", { name: "Unește cu…" }).click();
  await c.getByLabel("Reclama de unit cu asta").selectOption({ label: `${b.nume} · ${CAMPANIE}` });
  await c.getByRole("button", { name: "Unește" }).click();
  await expect(card(page, b.nume)).toHaveCount(0);
  await expect(c).toContainText(/Lead-uri\s*3/);
  await expect(c.getByRole("button", { name: `Cheltuit pe ${a.nume}` })).toHaveText("150 lei");
});

test("caller și constructor nu văd Reclame în meniu, iar /reclame dă 404", async ({ page }) => {
  for (const cont of ["caller", "constructor"] as const) {
    await page.context().clearCookies();
    await intraCa(page, cont);
    await expect(page.getByRole("link", { name: "Reclame" })).toHaveCount(0);
    await page.goto("/reclame");
    await expect(page.getByText("404")).toBeVisible();
  }
});

test("390px: meniul de jos are 7 intrări vizibile, cardurile pe o coloană, fără derulare orizontală", async ({ page }) => {
  const a = await reclama({ lead_uri: 1, cheltuit: null });
  const b = await reclama({ lead_uri: 2, cheltuit: null });
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  await page.goto("/reclame");
  const jos = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  await expect(jos.getByRole("link")).toHaveCount(7);
  await expect(jos.getByRole("link", { name: "Reclame" })).toBeVisible();
  const x1 = (await card(page, a.nume).boundingBox())!.x;
  const x2 = (await card(page, b.nume).boundingBox())!.x;
  expect(x1).toBe(x2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
