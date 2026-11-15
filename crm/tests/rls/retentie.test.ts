import { afterAll, describe, expect, it } from "vitest";
import { GET as zilnic } from "@/app/api/cron/zilnic/route";
import { anonimizeazaVechi, copieSaptamanala } from "@/lib/retentie";
import { admin, clientDeTest, idDe, leadDeTest, sterge } from "./ajutor";

const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await sterge(id);
});

const ziInUrma = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

describe("anonimizeazaVechi", () => {
  it("anonimizează lead-urile mai vechi de 365 de zile, nu și clienții", async () => {
    const vechi = await leadDeTest({ stare: "pierdut", motiv: "Prea scump", intrat_la: ziInUrma(366) });
    const recent = await leadDeTest({ stare: "pierdut", motiv: "Prea scump", intrat_la: ziInUrma(364) });
    const client = await leadDeTest({ stare: "client", intrat_la: ziInUrma(400) });
    lead_uri.push(vechi.id, recent.id, client.id);
    const c = await admin().from("cereri").insert({ lead_id: vechi.id, sursa: "formular_site" }).select("id").single();
    expect(c.error).toBeNull();

    const n = await anonimizeazaVechi(admin(), new Date());
    expect(n).toBeGreaterThanOrEqual(1);

    const { data } = await admin().from("lead_uri").select("id, anonimizat_la").in("id", lead_uri);
    const fara = (data ?? []).filter((l) => l.anonimizat_la).map((l) => l.id);
    expect(fara).toContain(vechi.id);
    expect(fara).not.toContain(recent.id);
    expect(fara).not.toContain(client.id);
    const { data: cereri } = await admin().from("cereri").select("id").eq("id", c.data!.id);
    expect(cereri).toHaveLength(0);
  });
});

describe("copieSaptamanala", () => {
  it("trimite la Resend toate tabelele, ca atașament", async () => {
    const l = await leadDeTest();
    const expira = await leadDeTest({ stare: "callback", intrat_la: ziInUrma(360) });
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
    expect(Object.keys(json.tabele).sort()).toEqual([
      "abonament_oameni", "abonamente", "cereri", "clienti", "comisioane", "conturi", "discutii", "evenimente", "evenimente_proiect",
      "lead_uri", "livrari", "materiale", "notite", "notite_proiect", "procente_baza", "profiluri", "program_closer", "proiect_oameni",
      "proiect_vanzari", "proiecte", "reclame", "reclame_lead_uri", "taskuri", "transe",
    ]);
    expect(json.tabele.lead_uri.map((x: { id: string }) => x.id)).toContain(l.id);
    expect(corp?.html).toContain(`/lead-uri/${expira.id}`);
    expect(corp?.html).not.toContain(`/lead-uri/${l.id}`);
  });

  it("clientul cu toate proiectele închise de peste un an apare în e-mail, cu link la fișa lui; cel cu un proiect deschis, nu", async () => {
    const vechi = await clientDeTest();
    const activ = await clientDeTest();
    lead_uri.push(vechi.lead.id, activ.lead.id);
    await admin().from("proiecte").update({ inchis_la: ziInUrma(400) }).eq("id", vechi.proiectId);
    await admin().from("proiect_oameni").insert({ proiect_id: activ.proiectId, om_id: await idDe("constructor") });

    const cheie = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_test";
    let corp: { html: string; attachments: { content: string }[] } | undefined;
    const f = (async (_url: string, init: RequestInit) => {
      corp = JSON.parse(init.body as string);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    try {
      expect(await copieSaptamanala(admin(), f)).toBe(true);
    } finally {
      if (cheie === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = cheie;
    }
    expect(corp?.html).toContain(`/clienti/${vechi.clientId}`);
    expect(corp?.html).not.toContain(`/clienti/${activ.clientId}`);
    // proiect_oameni n-are coloana „id”: copia trebuie să-l citească oricum
    const json = JSON.parse(Buffer.from(corp!.attachments[0].content, "base64").toString("utf8"));
    expect(json.tabele.proiect_oameni.some((r: { proiect_id: string }) => r.proiect_id === activ.proiectId)).toBe(true);
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

  it("cu secretul → 200 și din câte a scos datele", async () => {
    process.env.CRON_SECRET = "secret-de-test";
    const r = await zilnic(new Request("http://localhost/api/cron/zilnic", { headers: { authorization: "Bearer secret-de-test" } }));
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ anonimizate: expect.any(Number) });
  });
});
