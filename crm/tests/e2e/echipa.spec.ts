import { expect, test, type Page } from "@playwright/test";
import { intraCa } from "./ajutor";
import { db, leadNou, stergeLead } from "./date";

// conturi temporare, ca să nu oprim conturile pe care le folosesc celelalte teste
let oameni: string[] = [];
let lead_uri: string[] = [];
test.afterEach(async () => {
  for (const id of lead_uri) await stergeLead(id);
  for (const id of oameni) await db().auth.admin.deleteUser(id);
  oameni = [];
  lead_uri = [];
});

async function omTemporar(nume: string, activ = true) {
  const email = `temp${Date.now()}@test.buildwithac.ro`;
  const { data, error } = await db().auth.admin.createUser({ email, password: process.env.CRM_PAROLA_TEST!, email_confirm: true });
  if (error) throw error;
  oameni.push(data.user.id);
  await db().from("profiluri").insert({ id: data.user.id, nume, email, rol: "caller", activ });
  return { id: data.user.id, email };
}

const rand = (page: Page, nume: string) => page.getByRole("row", { name: new RegExp(nume) });

test("invitația apare în tabel ca „Invitat”, cu linkul de rezervă", async ({ page }) => {
  const email = `invitat${Date.now()}@test.buildwithac.ro`;
  await intraCa(page, "admin");
  await page.goto("/echipa");
  await page.getByLabel("Nume").fill("E2E Invitat");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("combobox", { name: /^Rol(?!ul)/ }).selectOption({ label: "Caller" });
  await page.getByRole("button", { name: "Trimite invitația" }).click();
  // pe test nu există cheie Resend: e-mailul nu pleacă, iar adminul primește linkul
  await expect(page.getByText("Trimite-i tu linkul ăsta")).toBeVisible();
  await expect(page.getByLabel("Linkul de invitație")).toHaveValue(/\/auth\/confirm\?token_hash=.+&type=invite/);
  const { data } = await db().from("profiluri").select("id").eq("email", email).single();
  oameni.push(data!.id);
  await expect(rand(page, email)).toContainText("Invitat");

  // a doua oară aceeași adresă → nu se dublează
  await page.getByLabel("Nume").fill("E2E Invitat");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("combobox", { name: /^Rol(?!ul)/ }).selectOption({ label: "Caller" });
  await page.getByRole("button", { name: "Trimite invitația" }).click();
  await expect(page.getByText("Omul ăsta are deja cont.")).toBeVisible();
});

test("contul oprit nu mai intră, apoi pornit din nou intră", async ({ page, browser }) => {
  const om = await omTemporar("E2E Pauză");
  await intraCa(page, "admin");
  await page.goto("/echipa");
  await rand(page, "E2E Pauză").getByRole("button", { name: "Oprește contul" }).click();
  await rand(page, "E2E Pauză").getByRole("button", { name: "Da, oprește-l" }).click();
  await expect(rand(page, "E2E Pauză")).toContainText("Oprit");

  const altul = await (await browser.newContext()).newPage();
  await altul.goto("/intra");
  await altul.getByLabel("E-mail").fill(om.email);
  await altul.getByLabel("Parola").fill(process.env.CRM_PAROLA_TEST!);
  await altul.getByRole("button", { name: "Intră" }).click();
  await expect(altul.getByText("Contul tău e oprit. Vorbește cu Andrei.")).toBeVisible();

  await rand(page, "E2E Pauză").getByRole("button", { name: "Pornește contul" }).click();
  // n-a intrat niciodată, deci după pornire apare „Invitat”, nu „Activ”
  await expect(rand(page, "E2E Pauză").getByRole("button", { name: "Oprește contul" })).toBeVisible();
  await expect(rand(page, "E2E Pauză")).not.toContainText("Oprit");
  await altul.getByLabel("E-mail").fill(om.email);
  await altul.getByLabel("Parola").fill(process.env.CRM_PAROLA_TEST!);
  await altul.getByRole("button", { name: "Intră" }).click();
  await expect(altul).toHaveURL(/\/lead-uri/);
});

test("lead-urile unui om oprit se mută toate la altcineva", async ({ page }) => {
  const om = await omTemporar("E2E Plecat", false);
  const l = await leadNou({ caller_id: om.id });
  lead_uri.push(l.id);
  await intraCa(page, "admin");
  await page.goto("/echipa");
  const r = rand(page, "E2E Plecat");
  await r.getByLabel("Mută tot la").selectOption({ label: "Mara Ionescu" });
  await r.getByRole("button", { name: "Mută" }).click();
  await expect(page.getByText("Am mutat 1 lead.")).toBeVisible();
  const { data } = await db().from("lead_uri").select("caller:profiluri!lead_uri_caller_id_fkey(nume)").eq("id", l.id).single();
  expect(data?.caller).toEqual({ nume: "Mara Ionescu" });
});

test("callerul nu intră pe Echipa", async ({ page }) => {
  await intraCa(page, "caller");
  await page.goto("/echipa");
  await expect(page).toHaveURL(/\/lead-uri$/);
});
