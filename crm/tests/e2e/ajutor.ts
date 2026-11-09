import { expect, type Page } from "@playwright/test";

export type Cont = "admin" | "caller" | "caller2" | "closer" | "constructor";

export async function intraCa(page: Page, cont: Cont) {
  await page.goto("/intra");
  await page.getByLabel("E-mail").fill(`${cont}@test.buildwithac.ro`);
  await page.getByLabel("Parola").fill(process.env.CRM_PAROLA_TEST!);
  await page.getByRole("button", { name: "Intră" }).click();
  await expect(page).toHaveURL(/\/lead-uri|\/clienti/);
}
