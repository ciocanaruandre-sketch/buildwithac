import { expect, test } from "@playwright/test";
import { ECHIPA_TEST } from "../../lib/echipa-test";
import { intraCa } from "./ajutor";

test("fără sesiune, lista duce la conectare", async ({ page }) => {
  await page.goto("/lead-uri");
  await expect(page).toHaveURL(/\/intra/);
});

test("parola greșită spune clar ce s-a întâmplat", async ({ page }) => {
  await page.goto("/intra");
  await page.getByLabel("E-mail").fill(ECHIPA_TEST.caller.email);
  await page.getByLabel("Parola").fill("gresita-de-tot");
  await page.getByRole("button", { name: "Intră" }).click();
  await expect(page.getByText("E-mailul sau parola nu se potrivesc.")).toBeVisible();
});

test("adminul vede „Echipa”, callerul nu", async ({ page, browser }) => {
  await intraCa(page, "admin");
  await expect(page.getByRole("link", { name: "Echipa" })).toBeVisible();

  const alt = await browser.newPage();
  await intraCa(alt, "caller");
  await expect(alt.getByRole("link", { name: "Lead-uri" })).toBeVisible();
  await expect(alt.getByRole("link", { name: "Echipa" })).toHaveCount(0);
  await alt.close();
});

test("callerul care deschide /echipa ajunge la lead-uri", async ({ page }) => {
  await intraCa(page, "caller");
  await page.goto("/echipa");
  await expect(page).toHaveURL(/\/lead-uri/);
});

test("„Ieși” închide sesiunea", async ({ page }) => {
  await intraCa(page, "caller");
  await page.getByRole("button", { name: "Ieși" }).click();
  await expect(page).toHaveURL(/\/intra/);
  await page.goto("/lead-uri");
  await expect(page).toHaveURL(/\/intra/);
});

test("constructorul vede doar „Clienți”", async ({ page }) => {
  await intraCa(page, "constructor");
  await expect(page.getByRole("link", { name: "Clienți" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lead-uri" })).toHaveCount(0);
});
