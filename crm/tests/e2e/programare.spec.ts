import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { idDe, leadNou, stergeLead } from "./date";

test("callerul programează discuția, iar ora ocupată dispare din calendar", async ({ page }) => {
  const caller = await idDe("caller");
  const a = await leadNou({ caller_id: caller, stare: "a_raspuns" });
  const b = await leadNou({ caller_id: caller, stare: "a_raspuns" });
  try {
    await intraCa(page, "caller");
    await page.goto(`/lead-uri/${a.id}`);
    await page.getByRole("link", { name: "Programează discuția" }).click();
    await page.getByRole("link", { name: "Ioana Dumitru" }).click();
    const primul = page.getByTestId("slot").first();
    const ora = await primul.getAttribute("data-la");
    expect(ora).toBeTruthy();
    await primul.click();
    await expect(page).toHaveURL(new RegExp(`/lead-uri/${a.id}$`));
    await expect(page.getByTestId("urmeaza")).toContainText("Discuție programată");
    await expect(page.getByTestId("urmeaza")).toContainText("Ioana Dumitru");
    await expect(page.getByTestId("stare")).toHaveText("Programat");

    await page.goto(`/lead-uri/${b.id}/programeaza?closer=${await idDe("closer")}`);
    await expect(page.getByTestId("slot").first()).toBeVisible();
    await expect(page.locator(`[data-la="${ora}"]`)).toHaveCount(0);
  } finally {
    await stergeLead(a.id);
    await stergeLead(b.id);
  }
});

test("closerul își vede și își salvează programul", async ({ page }) => {
  await intraCa(page, "closer");
  await page.getByRole("link", { name: "Program", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Programul meu" })).toBeVisible();
  await expect(page.getByLabel("Luni", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Salvează programul" }).click();
  await expect(page.getByText("Programul e salvat.")).toBeVisible();
});
