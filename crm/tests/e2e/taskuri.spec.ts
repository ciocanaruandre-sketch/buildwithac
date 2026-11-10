import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, idDe, punePeProiect, stergeLead, ziPeste } from "./date";

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

test("adminul adaugă un task întârziat; constructorul îl vede în „Task-urile mele” și îl bifează", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  const taskuri = page.getByTestId("taskuri");
  await taskuri.getByLabel("Ce e de făcut").fill("Pagina de meniu: pozele de la client");
  await taskuri.getByLabel("Cine").selectOption({ label: "Radu Stan" });
  await taskuri.getByLabel("Termen").fill(ziPeste(-1));
  await taskuri.getByRole("button", { name: "Adaugă task-ul" }).click();

  const rand = taskuri.getByRole("listitem").filter({ hasText: "Pagina de meniu: pozele de la client" });
  await expect(rand).toContainText("Radu Stan");
  await expect(rand).toContainText("întârziat");
  const urmeaza = page.getByTestId("urmeaza");
  await expect(urmeaza).toContainText("Pagina de meniu: pozele de la client");
  await expect(urmeaza).toContainText("întârziat o zi");
  await expect(urmeaza).toContainText("0 din 1 task-uri gata");

  await page.context().clearCookies();
  await intraCa(page, "constructor");
  await page.getByRole("link", { name: "Task-urile mele" }).click();
  await expect(page).toHaveURL(/\/taskuri$/);
  const intarziate = page.getByRole("region", { name: "Întârziate" });
  const alMeu = intarziate.getByRole("listitem").filter({ hasText: "Pagina de meniu: pozele de la client" });
  await expect(alMeu).toContainText(c.nume);
  await alMeu.getByRole("checkbox").check();
  await expect(page.getByText("Pagina de meniu: pozele de la client")).toHaveCount(0);

  await page.goto(`/clienti/${c.clientId}`);
  await expect(page.getByTestId("urmeaza")).toContainText("Toate task-urile sunt gata.");
  await expect(page.getByTestId("urmeaza")).toContainText("1 din 1 task-uri gata");
});

test("titlu gol → „Scrie ce e de făcut.”, nimic adăugat", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  const taskuri = page.getByTestId("taskuri");
  await taskuri.getByLabel("Ce e de făcut").fill("   ");
  await taskuri.getByRole("button", { name: "Adaugă task-ul" }).click();
  await expect(taskuri.getByText("Scrie ce e de făcut.")).toBeVisible();
  const { data } = await db().from("taskuri").select("id").eq("proiect_id", c.proiectId);
  expect(data).toEqual([]);
});

test("constructorul schimbă și șterge un task de pe proiectul lui", async ({ page }) => {
  const c = await client();
  await db().from("taskuri").insert({ proiect_id: c.proiectId, titlu: "Rezervări prin WhatsApp" });
  await intraCa(page, "constructor");
  await page.goto(`/clienti/${c.clientId}`);
  const taskuri = page.getByTestId("taskuri");
  const rand = taskuri.getByRole("listitem").filter({ hasText: "Rezervări prin WhatsApp" });
  await rand.getByRole("button", { name: "Schimbă" }).click();
  await taskuri.getByLabel("Titlul task-ului").fill("Rezervări prin WhatsApp, pe pagina de contact");
  await taskuri.getByLabel("Termenul task-ului").fill(ziPeste(5));
  await taskuri.getByRole("button", { name: "Salvează" }).click();
  const schimbat = taskuri.getByRole("listitem").filter({ hasText: "Rezervări prin WhatsApp, pe pagina de contact" });
  await expect(schimbat).toBeVisible();
  const { data } = await db().from("taskuri").select("titlu, termen").eq("proiect_id", c.proiectId).single();
  expect(data).toEqual({ titlu: "Rezervări prin WhatsApp, pe pagina de contact", termen: ziPeste(5) });

  await schimbat.getByRole("button", { name: "Șterge" }).click();
  await schimbat.getByRole("button", { name: "Sigur?" }).click();
  await expect(taskuri.getByText("Rezervări prin WhatsApp, pe pagina de contact")).toHaveCount(0);
});

test("callerul n-are „Task-urile mele” și nu intră pe pagină", async ({ page }) => {
  await intraCa(page, "caller");
  await expect(page.getByRole("link", { name: "Task-urile mele" })).toHaveCount(0);
  await page.goto("/taskuri");
  await expect(page).toHaveURL(/\/lead-uri$/);
});

test("Echipa: task-urile unui constructor oprit trec la Admin cu „Mută tot la…”", async ({ page }) => {
  const c = await clientNou();
  deSters.push(c.leadId);
  // un constructor temporar, cu un task pe numele lui, apoi oprit
  const email = `e2e-plecat-${Date.now()}@test.buildwithac.ro`;
  const cont = await db().auth.admin.createUser({ email, email_confirm: true });
  const plecat = cont.data.user!.id;
  try {
    await db().from("profiluri").insert({ id: plecat, nume: "E2E Constructor Plecat", email, rol: "constructor" });
    await db().from("proiect_oameni").insert({ proiect_id: c.proiectId, om_id: plecat });
    const t = await db().from("taskuri").insert({ proiect_id: c.proiectId, titlu: "Rămas de făcut", om_id: plecat }).select("id").single();
    await db().from("profiluri").update({ activ: false }).eq("id", plecat);

    await intraCa(page, "admin");
    await page.goto("/echipa");
    const r = page.getByRole("row").filter({ hasText: "E2E Constructor Plecat" });
    await r.getByLabel("Mută tot la").selectOption({ label: "Andrei Ciocănaru" });
    await r.getByRole("button", { name: "Mută" }).click();
    await expect(page.getByText("Am mutat un task.")).toBeVisible();
    const { data } = await db().from("taskuri").select("om_id").eq("id", t.data!.id).single();
    expect(data?.om_id).toBe(await idDe("admin"));
  } finally {
    await db().auth.admin.deleteUser(plecat);
  }
});
