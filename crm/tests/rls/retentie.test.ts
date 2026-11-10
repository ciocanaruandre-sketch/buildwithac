import { afterAll, describe, expect, it } from "vitest";
import { GET as zilnic } from "@/app/api/cron/zilnic/route";
import { copieSaptamanala, stergeVechi } from "@/lib/retentie";
import { admin, leadDeTest, sterge } from "./ajutor";

const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await sterge(id);
});

const ziInUrma = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

describe("stergeVechi", () => {
  it("șterge lead-urile mai vechi de 90 de zile (cu cererile lor), nu și clienții", async () => {
    const vechi = await leadDeTest({ stare: "pierdut", motiv: "Prea scump", intrat_la: ziInUrma(91) });
    const recent = await leadDeTest({ stare: "pierdut", motiv: "Prea scump", intrat_la: ziInUrma(89) });
    const client = await leadDeTest({ stare: "client", intrat_la: ziInUrma(200) });
    lead_uri.push(vechi.id, recent.id, client.id);
    const c = await admin().from("cereri").insert({ lead_id: vechi.id, sursa: "formular_site" }).select("id").single();
    expect(c.error).toBeNull();

    const n = await stergeVechi(admin(), new Date());
    expect(n).toBeGreaterThanOrEqual(1);

    const { data } = await admin().from("lead_uri").select("id").in("id", lead_uri);
    const ramase = (data ?? []).map((l) => l.id);
    expect(ramase).not.toContain(vechi.id);
    expect(ramase).toContain(recent.id);
    expect(ramase).toContain(client.id);
    const { data: cereri } = await admin().from("cereri").select("id").eq("id", c.data!.id);
    expect(cereri).toHaveLength(0);
  });
});

describe("copieSaptamanala", () => {
  it("trimite la Resend toate tabelele, ca atașament", async () => {
    const l = await leadDeTest();
    const expira = await leadDeTest({ stare: "callback", intrat_la: ziInUrma(85) });
    lead_uri.push(l.id, expira.id);
    const vechi = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test";
    let corp: { to: string[]; subject: string; html: string; attachments: { filename: string; content: string }[] } | undefined;
    const f = (async (_url: string, init: RequestInit) => {
      corp = JSON.parse(init.body as string);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      expect(await copieSaptamanala(admin(), f)).toBe(true);
    } finally {
      if (vechi === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = vechi;
    }
    expect(corp?.subject).toMatch(/^Copia CRM-ului, \d{4}-\d{2}-\d{2}$/);
    expect(corp?.attachments[0].filename).toMatch(/^crm-\d{4}-\d{2}-\d{2}\.json$/);
    const json = JSON.parse(Buffer.from(corp!.attachments[0].content, "base64").toString("utf8"));
    expect(Object.keys(json.tabele).sort()).toEqual(["cereri", "clienti", "discutii", "evenimente", "lead_uri", "notite", "profiluri", "program_closer"]);
    expect(json.tabele.lead_uri.map((x: { id: string }) => x.id)).toContain(l.id);
    expect(corp?.html).toContain(`/lead-uri/${expira.id}`);
    expect(corp?.html).not.toContain(`/lead-uri/${l.id}`);
  });
});

describe("ruta /api/cron/zilnic", () => {
  it("fără secret → 401", async () => {
    process.env.CRON_SECRET = "secret-de-test";
    const r = await zilnic(new Request("http://localhost/api/cron/zilnic"));
    expect(r.status).toBe(401);
    const gresit = await zilnic(new Request("http://localhost/api/cron/zilnic", { headers: { authorization: "Bearer altul" } }));
    expect(gresit.status).toBe(401);
  });

  it("cu secretul → 200 și câte a șters", async () => {
    process.env.CRON_SECRET = "secret-de-test";
    const r = await zilnic(new Request("http://localhost/api/cron/zilnic", { headers: { authorization: "Bearer secret-de-test" } }));
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ sterse: expect.any(Number) });
  });
});
