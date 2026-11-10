import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, stergeLead } from "./date";

let deSters: { leadId: string; proiectId: string }[] = [];
test.afterEach(async () => {
  for (const c of deSters) {
    // ce a rămas în bucket de la un test picat
    const { data: dosare } = await db().storage.from("materiale").list(c.proiectId);
    for (const d of dosare ?? []) {
      const { data: f } = await db().storage.from("materiale").list(`${c.proiectId}/${d.name}`);
      if (f?.length) await db().storage.from("materiale").remove(f.map((x) => `${c.proiectId}/${d.name}/${x.name}`));
    }
    await stergeLead(c.leadId);
  }
  deSters = [];
});
const client = async () => {
  const c = await clientNou();
  deSters.push(c);
  return c;
};

/** Căile tuturor fișierelor din dosarul unui proiect. */
async function fisiereleProiectului(proiectId: string): Promise<string[]> {
  const toate: string[] = [];
  const { data: dosare } = await db().storage.from("materiale").list(proiectId);
  for (const d of dosare ?? []) {
    const { data: f } = await db().storage.from("materiale").list(`${proiectId}/${d.name}`);
    toate.push(...(f ?? []).map((x) => `${proiectId}/${d.name}/${x.name}`));
  }
  return toate;
}

test("un fișier se încarcă, se descarcă și se șterge (și din bucket)", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Materiale" }).click();
  const materiale = page.getByTestId("materiale");
  await materiale.getByLabel("Încarcă un fișier").setInputFiles({ name: "Textele paginilor.txt", mimeType: "text/plain", buffer: Buffer.from("Bine ai venit la cafenea.") });

  const rand = materiale.getByRole("listitem").filter({ hasText: "Textele paginilor.txt" });
  await expect(rand).toBeVisible();
  await expect(rand).toContainText("25 B");
  await expect(rand).toContainText("FIȘ");
  expect(await fisiereleProiectului(c.proiectId)).toHaveLength(1);

  const descarcare = page.waitForEvent("download");
  await rand.getByRole("link", { name: "deschide" }).click();
  expect((await descarcare).suggestedFilename()).toBe("Textele-paginilor.txt");

  await rand.getByRole("button", { name: "Șterge" }).click();
  await rand.getByRole("button", { name: "Sigur?" }).click();
  await expect(materiale.getByText("Textele paginilor.txt")).toHaveCount(0);
  expect(await fisiereleProiectului(c.proiectId)).toEqual([]);
  expect((await db().from("materiale").select("id").eq("proiect_id", c.proiectId)).data).toEqual([]);
});

test("fișier de peste 25 MB → mesaj clar, nimic încărcat", async ({ page }) => {
  const c = await client();
  await intraCa(page, "admin");
  await page.goto(`/clienti/${c.clientId}`);
  await page.getByRole("tab", { name: "Materiale" }).click();
  const materiale = page.getByTestId("materiale");
  await materiale.getByLabel("Încarcă un fișier").setInputFiles({ name: "filmare.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(26 * 1024 * 1024) });
  await expect(materiale.getByText("Fișierul are peste 25 MB. Pune-l pe Drive și adaugă link-ul.")).toBeVisible();
  expect(await fisiereleProiectului(c.proiectId)).toEqual([]);
  expect((await db().from("materiale").select("id").eq("proiect_id", c.proiectId)).data).toEqual([]);
});

test("constructorul din afara proiectului nu poate descărca fișierul altui proiect", async ({ page }) => {
  const c = await client();
  const cale = `${c.proiectId}/11111111-1111-4111-8111-111111111111/secret.txt`;
  await db().storage.from("materiale").upload(cale, Buffer.from("secret"), { contentType: "text/plain" });
  const { data: m } = await db().from("materiale").insert({ proiect_id: c.proiectId, titlu: "secret.txt", cale, marime: 6 }).select("id").single();
  await intraCa(page, "constructor");
  const r = await page.request.get(`/materiale/${m!.id}`, { maxRedirects: 0 });
  expect(r.status()).toBe(404);

  // Adminul primește un link semnat, de scurtă durată, spre același fișier
  await page.context().clearCookies();
  await intraCa(page, "admin");
  const a = await page.request.get(`/materiale/${m!.id}`, { maxRedirects: 0 });
  expect(a.status()).toBe(307);
  expect(a.headers().location).toContain("/storage/v1/object/sign/materiale/");
  expect(a.headers().location).toContain("download=secret.txt");
});
