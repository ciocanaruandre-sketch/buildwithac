import { createCipheriv, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { intraCa } from "./ajutor";
import { db, idDe, leadNou, stergeLead } from "./date";

// Google-ul fals (tests/e2e/google-fals.mjs) răspunde la orice; ocupat zilnic 12:00–13:00, ora României.
const FALS = "http://localhost:3199";
const pica = (da: boolean) => fetch(`${FALS}/__pica`, { method: "POST", body: JSON.stringify({ pica: da }) });

/** Aceeași criptare ca lib/calendar/criptare.ts (acela e „server-only” și nu se poate importa aici). */
function cripteaza(text: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", Buffer.from(process.env.GOOGLE_CHEIE_CRIPTARE!, "base64"), iv);
  const date = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), date.toString("base64url")].join(".");
}

async function conecteaza(omId: string) {
  await db().from("google_conexiuni").delete().eq("om_id", omId);
  const { error } = await db().from("google_conexiuni").insert({ om_id: omId, email: "test@exemplu.ro", refresh_criptat: cripteaza("r") });
  if (error) throw error;
}
const deconecteaza = (omId: string) => db().from("google_conexiuni").delete().eq("om_id", omId);

test.describe.configure({ mode: "serial" });

test.afterEach(async () => {
  await pica(false);
  await deconecteaza(await idDe("closer"));
});

test("cardul „conectat” și „Deconectează”", async ({ page }) => {
  await conecteaza(await idDe("closer"));
  await intraCa(page, "closer");
  // ca la întoarcerea de la Google
  await page.goto("/program?google=ok");
  await expect(page.getByText("Gata, calendarul e conectat.")).toBeVisible();
  const card = page.getByTestId("card-google");
  await expect(card).toContainText("Google Calendar · conectat");
  await expect(card).toContainText("test@exemplu.ro");
  await card.getByRole("button", { name: "Deconectează" }).click();
  await expect(card).toContainText("Scot din Google Calendar toate discuțiile puse de CRM");
  await card.getByRole("button", { name: "Da, deconectează" }).click();
  await expect(card.getByRole("link", { name: "Conectează Google Calendar" })).toBeVisible();
  // mesajul de la conectare nu mai are ce căuta, nici după reîncărcare
  await expect(page.getByText("Gata, calendarul e conectat.")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Gata, calendarul e conectat.")).toHaveCount(0);
});

test("ora de 12 e gri", async ({ page }) => {
  const closer = await idDe("closer");
  await conecteaza(closer);
  const l = await leadNou({ caller_id: await idDe("caller"), stare: "a_raspuns" });
  try {
    await intraCa(page, "admin");
    await page.goto(`/lead-uri/${l.id}/programeaza?closer=${closer}`);
    const gri = page.locator('[data-testid="slot-ocupat"][title="Ocupat în Google Calendar"]', { hasText: "12:00" }).first();
    await expect(gri).toBeVisible();
    expect(await gri.evaluate((e) => e.tagName)).toBe("SPAN");
    await expect(page.getByText("ocupată (Google Calendar sau altă discuție)")).toBeVisible();
  } finally {
    await stergeLead(l.id);
  }
});

test("callerul vede gri, fără e-mail", async ({ page }) => {
  const closer = await idDe("closer");
  await conecteaza(closer);
  const l = await leadNou({ caller_id: await idDe("caller"), stare: "a_raspuns" });
  try {
    await intraCa(page, "caller");
    await page.goto(`/lead-uri/${l.id}/programeaza?closer=${closer}`);
    await expect(page.locator('[data-testid="slot-ocupat"][title="Ocupat în Google Calendar"]', { hasText: "12:00" }).first()).toBeVisible();
    expect(await page.content()).not.toContain("test@exemplu.ro");
  } finally {
    await stergeLead(l.id);
  }
});

test("Google pică: „N-a ajuns în calendar”, apoi „Reîncearcă”", async ({ page }) => {
  const closer = await idDe("closer");
  await conecteaza(closer);
  const l = await leadNou({ caller_id: await idDe("caller"), stare: "a_raspuns" });
  try {
    await pica(true);
    await intraCa(page, "caller");
    await page.goto(`/lead-uri/${l.id}/programeaza?closer=${closer}`);
    await page.getByTestId("slot").first().click();
    await expect(page).toHaveURL(new RegExp(`/lead-uri/${l.id}$`));
    const rand = page.getByTestId("rand-calendar");
    await expect(async () => {
      await page.reload();
      await expect(rand).toContainText("N-a ajuns în calendar", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });

    // „Reîncearcă” cu Google încă picat: spune că n-a mers
    await rand.getByRole("button", { name: "Reîncearcă" }).click();
    await expect(rand).toContainText("N-a mers nici acum");

    await pica(false);
    await rand.getByRole("button", { name: "Reîncearcă" }).click();
    await expect(rand).toContainText("✓ În Google Calendar");
    await expect(rand).toContainText("la Ioana");
  } finally {
    await stergeLead(l.id);
  }
});

test("neconectat: alerta pe „Programează” și rândul de pe fișă", async ({ page }) => {
  const closer = await idDe("closer");
  await deconecteaza(closer);
  const l = await leadNou({ caller_id: await idDe("caller"), stare: "a_raspuns" });
  try {
    await intraCa(page, "caller");
    await page.goto(`/lead-uri/${l.id}/programeaza?closer=${closer}`);
    await expect(page.getByText("Ioana n-a conectat Google Calendar.")).toBeVisible();
    await page.getByTestId("slot").first().click();
    await expect(page).toHaveURL(new RegExp(`/lead-uri/${l.id}$`));
    await expect(async () => {
      await page.reload();
      await expect(page.getByTestId("rand-calendar")).toContainText("Ioana n-are Google Calendar conectat", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
  } finally {
    await stergeLead(l.id);
  }
});
