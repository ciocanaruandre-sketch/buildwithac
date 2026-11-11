import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { clientNou, db, idDe, stergeLead } from "./date";

test("pe laptop, bara laterală arată legătura activă", async ({ page }) => {
  await intraCa(page, "admin");
  await page.goto("/clienti");
  const nav = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  await expect(nav.getByRole("link", { name: "Clienți" })).toHaveAttribute("aria-current", "page");
});

test("pe telefon, legăturile sunt jos și nu acoperă pagina", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  const jos = page.getByRole("navigation", { name: "Navigare" }).filter({ visible: true });
  const cutie = (await jos.boundingBox())!;
  expect(cutie.y + cutie.height).toBeGreaterThan(844 - 40);
  await jos.getByRole("link", { name: "Echipa" }).click();
  await expect(page).toHaveURL(/\/echipa/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const ultim = await page.locator("main > *").last().boundingBox();
  expect(ultim!.y + ultim!.height).toBeLessThanOrEqual(cutie.y + 1);
});

test("căsuța din bara de sus găsește lead-ul după cuvânt și după bucăți de telefon", async ({ page }) => {
  await intraCa(page, "caller");
  const caseta = page.getByRole("searchbox", { name: "Caută lead-uri" });
  await caseta.fill("cafeneaua");
  await caseta.press("Enter");
  await expect(page).toHaveURL(/\/lead-uri\?q=cafeneaua/);
  await expect(page.getByRole("link", { name: "Elena Marin · Cafeneaua Boabe" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cristian Popa · Salon Aura" })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Caută lead-uri" }).fill("000 001");
  await page.getByRole("searchbox", { name: "Caută lead-uri" }).press("Enter");
  await expect(page).toHaveURL(/q=000\+001/);
  await expect(page.getByRole("link", { name: "Elena Marin · Cafeneaua Boabe" })).toBeVisible();
});

test("Ctrl K duce cursorul în căutare; pe telefon, căsuța se deschide din lupă", async ({ page }) => {
  await intraCa(page, "caller");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toBeHidden();
  await page.getByRole("button", { name: "Caută lead-uri" }).click();
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toBeFocused();
});

test("pe telefon, o căutare activă nu acoperă „+ Lead de mână”, iar căsuța se închide cu ×", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "caller");
  await page.goto("/lead-uri?q=laura");
  await expect(page.getByRole("link", { name: "+ Lead de mână" })).toBeVisible();
  await page.getByRole("button", { name: "Caută lead-uri" }).click();
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toHaveValue("laura");
  await page.getByRole("button", { name: "Închide căutarea" }).click();
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toBeHidden();
  await expect(page.getByRole("link", { name: "+ Lead de mână" })).toBeVisible();
});

test("constructorul nu are căutarea de lead-uri", async ({ page }) => {
  await intraCa(page, "constructor");
  await expect(page.getByRole("searchbox", { name: "Caută lead-uri" })).toHaveCount(0);
});

test("fișa clientului: tab-urile sunt un comutator, la 390px fără scroll orizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await intraCa(page, "admin");
  await page.goto("/clienti");
  await page.getByRole("link", { name: /Laura Ene/ }).first().click();
  await page.getByRole("tab", { name: /Parcurs/ }).click();
  const tab = page.getByRole("tab", { name: /Parcurs/ });
  await expect(tab).toHaveAttribute("aria-selected", "true");
  // comutatorul: tab-ul ales e o pastilă cu fundal, nu o linie dedesubt
  await expect(tab).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(tab).toHaveCSS("border-bottom-width", "0px");
  const lat = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(lat).toBeLessThanOrEqual(390);
});

test("bifa rotundă a unui task se poate apăsa", async ({ page }) => {
  const c = await clientNou();
  try {
    await intraCa(page, "admin");
    await page.goto(`/clienti/${c.clientId}`);
    const taskuri = page.getByTestId("taskuri");
    await taskuri.getByLabel("Ce e de făcut").fill("Bifa rotundă de probă");
    await taskuri.getByRole("button", { name: "Adaugă task-ul" }).click();
    const bifa = taskuri.getByRole("checkbox", { name: "Gata: Bifa rotundă de probă" });
    await expect(bifa).toBeVisible();
    await expect(taskuri.getByTestId("cerc-bifa").first()).toHaveCSS("border-radius", "50%");
    await bifa.click();
    await expect(bifa).toBeChecked();
    const titlu = taskuri.getByRole("listitem").filter({ hasText: "Bifa rotundă de probă" }).getByText("Bifa rotundă de probă", { exact: true });
    await expect(titlu).toHaveCSS("text-decoration-line", "line-through");
  } finally {
    await stergeLead(c.leadId);
  }
});

test("Task-urile mele, la 390px: clientul și proiectul lung nu fac scroll orizontal", async ({ page }) => {
  const c = await clientNou({ nume: "E2E Clientă cu un nume lung · Agenția de Turism și Evenimente" });
  try {
    await db().from("proiecte").update({ titlu: "Automatizare pentru ofertele trimise clienților" }).eq("id", c.proiectId);
    const t = await db().from("taskuri").insert({ proiect_id: c.proiectId, titlu: "Task de probă cu proiect lung", om_id: await idDe("admin") });
    if (t.error) throw t.error;
    await page.setViewportSize({ width: 390, height: 844 });
    await intraCa(page, "admin");
    await page.goto("/taskuri");
    await expect(page.getByText("Task de probă cu proiect lung")).toBeVisible();
    const lat = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(lat).toBeLessThanOrEqual(390);
  } finally {
    await stergeLead(c.leadId);
  }
});
