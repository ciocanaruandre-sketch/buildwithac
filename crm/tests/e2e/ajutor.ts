import { expect, type Page } from "@playwright/test";
import { ECHIPA_TEST, type ContTest } from "../../lib/echipa-test";

export type Cont = ContTest;

export async function intraCa(page: Page, cont: Cont) {
  await page.goto("/intra");
  await page.getByLabel("E-mail").fill(ECHIPA_TEST[cont].email);
  await page.getByLabel("Parola").fill(process.env.CRM_PAROLA_TEST!);
  await page.getByRole("button", { name: "Intră" }).click();
  await expect(page).toHaveURL(/\/lead-uri|\/clienti/);
}
