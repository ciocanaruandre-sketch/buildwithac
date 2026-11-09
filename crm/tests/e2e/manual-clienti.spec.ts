import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { db, idDe, leadNou, stergeLead } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});

const telefonUnic = () => {
  const s = Date.now().toString().slice(-6);
  return { scris: `0788 ${s.slice(0, 3)} ${s.slice(3)}`, norm: `40788${s}` };
};

test("callerul adaugă un lead „Cold calling” și ajunge pe fișa lui", async ({ page }) => {
  const tel = telefonUnic();
  await intraCa(page, "caller");
  await page.goto("/lead-uri");
  await page.getByRole("link", { name: "+ Lead de mână" }).click();
  await page.getByLabel("Nume").fill("E2E Manual · Cafeneaua Mică");
  await page.getByLabel("Telefon").fill(tel.scris);
  await page.getByLabel("Serviciu").selectOption({ label: "Site" });
  await page.getByLabel("Sursă").selectOption({ label: "Cold calling" });
  await page.getByLabel("Notiță").fill("Sunat de pe Google Maps, vrea ofertă.");
  await page.getByRole("button", { name: "Adaugă lead-ul" }).click();

  await expect(page).toHaveURL(/\/lead-uri\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  deSters.push(id);
  await expect(page.getByRole("heading", { name: "E2E Manual · Cafeneaua Mică" })).toBeVisible();
  const caller = await idDe("caller");
  const { data } = await db().from("lead_uri").select("caller_id, creat_de, telefon_norm, sursa").eq("id", id).single();
  expect(data).toEqual({ caller_id: caller, creat_de: caller, telefon_norm: tel.norm, sursa: "cold_calling" });
  await expect(page.getByTestId("parcurs").getByText("A intrat în CRM · Cold calling")).toBeVisible();
  await page.getByRole("tab", { name: "Notițe" }).click();
  await expect(page.getByTestId("notite").getByText("Sunat de pe Google Maps, vrea ofertă.")).toBeVisible();
});

test("același telefon încă o dată → „Omul ăsta e deja în CRM.”, cu link la fișă", async ({ page }) => {
  const l = await leadNou();
  deSters.push(l.id);
  await intraCa(page, "caller");
  await page.goto("/lead-uri/nou");
  await page.getByLabel("Nume").fill("Același om");
  await page.getByLabel("Telefon").fill(`+${l.telefon_norm}`);
  await page.getByLabel("Serviciu").selectOption({ label: "Automatizări" });
  await page.getByLabel("Sursă").selectOption({ label: "Recomandare" });
  await page.getByRole("button", { name: "Adaugă lead-ul" }).click();
  await expect(page.getByText("Omul ăsta e deja în CRM.")).toBeVisible();
  await page.getByRole("link", { name: "Deschide fișa lui" }).click();
  await expect(page).toHaveURL(new RegExp(`/lead-uri/${l.id}$`));
});

test("fără telefon și fără e-mail → nu se creează nimic", async ({ page }) => {
  await intraCa(page, "caller");
  await page.goto("/lead-uri/nou");
  await page.getByLabel("Nume").fill("Fără contact");
  await page.getByRole("button", { name: "Adaugă lead-ul" }).click();
  await expect(page.getByText("Scrie măcar telefonul sau e-mailul.")).toBeVisible();
  await expect(page).toHaveURL(/\/lead-uri\/nou$/);
});

test("adminul poate lăsa lead-ul liber", async ({ page }) => {
  const tel = telefonUnic();
  await intraCa(page, "admin");
  await page.goto("/lead-uri/nou");
  await page.getByLabel("Nume").fill("E2E Liber");
  await page.getByLabel("Telefon").fill(tel.scris);
  await page.getByLabel("Serviciu").selectOption({ label: "Automatizări" });
  await page.getByLabel("Sursă").selectOption({ label: "Reclamă Meta" });
  await page.getByLabel("Las-l liber").check();
  await page.getByRole("button", { name: "Adaugă lead-ul" }).click();
  await expect(page).toHaveURL(/\/lead-uri\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  deSters.push(id);
  const { data } = await db().from("lead_uri").select("caller_id, sursa").eq("id", id).single();
  expect(data).toEqual({ caller_id: null, sursa: "reclama_meta" });
});

test("closerul marchează „Client” → lead-ul apare în Clienți", async ({ page }) => {
  const l = await leadNou({ caller_id: await idDe("caller"), closer_id: await idDe("closer"), stare: "programat" });
  deSters.push(l.id);
  await intraCa(page, "closer");
  await page.goto(`/lead-uri/${l.id}`);
  await page.getByRole("button", { name: "Client", exact: true }).click();
  await expect(page.getByTestId("stare")).toHaveText("Client");
  await page.getByRole("link", { name: "Clienți" }).click();
  const rand = page.getByRole("row", { name: new RegExp(l.nume) });
  await expect(rand).toContainText("Mara Ionescu");
  await rand.getByRole("link", { name: l.nume }).click();
  await expect(page).toHaveURL(new RegExp(`/lead-uri/${l.id}$`));
});

test("constructorul vede textul de așteptare și niciun client", async ({ page }) => {
  await intraCa(page, "constructor");
  await page.goto("/clienti");
  await expect(page.getByText("Aici apar clienții la care lucrezi, după ce te pune Andrei pe un proiect.")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
