import { describe, it, expect } from "vitest";
import { trimiteLaCrm } from "@/lib/crm";
import type { CerereContact } from "@/lib/contact";

const mediu = { url: "https://crm.test", secret: "s" };
const c: CerereContact = { nume: "Maria Popescu", telefon: "0721123456", serviciu: "site", descriere: "Am o cafenea" };

/** fetch fals: ține minte corpul trimis și răspunde cu un lead. */
function fals() {
  const trimise: Record<string, unknown>[] = [];
  const f = (async (_u: string, init: RequestInit) => {
    trimise.push(JSON.parse(init.body as string));
    return new Response(JSON.stringify({ id: "lead-1" }), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, trimise };
}

describe("trimiteLaCrm: puntea pentru CRM", () => {
  it("o cerere crm intră în CRM ca altceva, cu [CRM] în față", async () => {
    const { f, trimise } = fals();
    expect(await trimiteLaCrm({ ...c, serviciu: "crm", descriere: "Am 3 calleri" }, mediu, f)).toEqual({ id: "lead-1" });
    expect(trimise[0]).toMatchObject({ serviciu: "altceva", descriere: "[CRM] Am 3 calleri" });
  });

  it("fără descriere: doar [CRM]", async () => {
    const { f, trimise } = fals();
    await trimiteLaCrm({ ...c, serviciu: "crm", descriere: "" }, mediu, f);
    expect(trimise[0]).toMatchObject({ serviciu: "altceva", descriere: "[CRM]" });
  });

  it("celelalte servicii trec neschimbate", async () => {
    const { f, trimise } = fals();
    await trimiteLaCrm(c, mediu, f);
    expect(trimise[0]).toMatchObject({ serviciu: "site", descriere: "Am o cafenea" });
  });
});
