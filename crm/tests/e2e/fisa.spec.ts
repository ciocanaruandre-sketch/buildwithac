import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { db, idDe, leadNou, stergeLead } from "./date";

let deSters: string[] = [];
test.afterEach(async () => {
  for (const id of deSters) await stergeLead(id);
  deSters = [];
});
const lead = async (...a: Parameters<typeof leadNou>) => {
  const l = await leadNou(...a);
  deSters.push(l.id);
  return l;
};

test("„Nu răspunde” de două ori: două încercări în Parcurs", async ({ page }) => {
  const l = await lead({ caller_id: await idDe("caller") });
  await intraCa(page, "caller");
  await page.goto(`/lead-uri/${l.id}`);
  await page.getByRole("button", { name: "Nu răspunde" }).click();
  await expect(page.getByTestId("parcurs").getByText("Nu a răspuns · încercarea 1")).toBeVisible();
  await page.getByRole("button", { name: "Nu răspunde" }).click();
  await expect(page.getByTestId("parcurs").getByText("Nu a răspuns · încercarea 2")).toBeVisible();
  await expect(page.getByTestId("stare")).toHaveText("Fără răspuns");
});

test("Callback „Mâine, 10:00” apare în cardul Acum / Urmează", async ({ page }) => {
  const l = await lead({ caller_id: await idDe("caller") });
  await intraCa(page, "caller");
  await page.goto(`/lead-uri/${l.id}`);
  await page.getByRole("button", { name: "Callback" }).click();
  await page.getByRole("button", { name: "Mâine, 10:00", exact: true }).click();
  await expect(page.getByTestId("urmeaza")).toContainText("Callback mâine, 10:00");
});

test("callerul nu vede „Client”; „Descalificat” cere motivul", async ({ page }) => {
  const l = await lead({ caller_id: await idDe("caller"), stare: "a_raspuns" });
  await intraCa(page, "caller");
  await page.goto(`/lead-uri/${l.id}`);
  await expect(page.getByRole("button", { name: "Client" })).toHaveCount(0);
  await page.getByRole("button", { name: "Descalificat" }).click();
  await page.getByRole("button", { name: "Confirmă" }).click();
  await expect(page.getByText("Scrie motivul.")).toBeVisible();
  await page.getByLabel("Motivul").fill("Număr greșit");
  await page.getByRole("button", { name: "Confirmă" }).click();
  await expect(page.getByTestId("stare")).toHaveText("Descalificat");
});

test("notița apare cu numele celui care a scris-o", async ({ page }) => {
  const l = await lead({ caller_id: await idDe("caller") });
  await intraCa(page, "caller");
  await page.goto(`/lead-uri/${l.id}`);
  await page.getByRole("tab", { name: "Notițe" }).click();
  await page.getByLabel("Notiță nouă").fill("A zis să revin după 15 noiembrie.");
  await page.getByRole("button", { name: "Adaugă notița" }).click();
  const notite = page.getByTestId("notite");
  await expect(notite.getByText("A zis să revin după 15 noiembrie.")).toBeVisible();
  await expect(notite.getByText("Mara Ionescu")).toBeVisible();
});

test("pe lead-ul altui caller, fișa se vede fără butoane", async ({ page }) => {
  const l = await lead({ caller_id: await idDe("caller2") });
  await intraCa(page, "caller");
  await page.goto(`/lead-uri/${l.id}`);
  await expect(page.getByRole("heading", { name: l.nume })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nu răspunde" })).toHaveCount(0);
});

test("adminul mută lead-ul la alt caller, iar Parcursul arată mutarea", async ({ page }) => {
  const l = await lead({ caller_id: await idDe("caller") });
  await intraCa(page, "admin");
  await page.goto(`/lead-uri/${l.id}`);
  await page.getByLabel("Mută callerul la").selectOption({ label: "Vlad Petrescu" });
  await page.getByRole("button", { name: "Mută" }).first().click();
  await expect(page.getByTestId("parcurs").getByText("Caller: Mara Ionescu → Vlad Petrescu")).toBeVisible();
});

test("fișa unui lead din reclamă arată Meta · campanie · reclamă", async ({ page }) => {
  const campanie = `Campanie e2e ${Date.now().toString(36)}`;
  const l = await lead({ sursa: "reclama_meta", caller_id: await idDe("caller") });
  const utm = { utm_source: "ig", utm_medium: "reclama", utm_campaign: campanie, utm_content: "Clip cafenea" };
  const c = await db().from("cereri").insert({ lead_id: l.id, sursa: "reclama_meta", raspunsuri: [], utm });
  if (c.error) throw c.error;
  const r = await db().rpc("atribuie_reclama", { p_lead: l.id, p_platforma: "meta", p_campanie: campanie, p_nume: "Clip cafenea" });
  if (r.error) throw r.error;
  try {
    for (const cont of ["admin", "caller"] as const) {
      await page.context().clearCookies();
      await intraCa(page, cont);
      await page.goto(`/lead-uri/${l.id}`);
      const rand = page.getByTestId("reclama").first();
      await expect(rand).toContainText("Meta");
      await expect(rand).toContainText(`${campanie} · Clip cafenea`);
      await expect(page.getByText("utm_")).toHaveCount(0);
      await expect(page.getByText("medium: reclama")).toHaveCount(0);
    }
  } finally {
    await db().from("reclame").delete().eq("campanie", campanie);
  }
});
