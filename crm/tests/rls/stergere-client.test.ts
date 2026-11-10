import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { curataFisiereOrfane, stergeFisiereleProiectului } from "@/lib/fisiere-bucket";
import { admin, clientDeTest, conecteazaCa, idDe, stergeClient } from "./ajutor";

const lead_uri: string[] = [];
const fisiere: string[] = [];
afterAll(async () => {
  if (fisiere.length) await admin().storage.from("materiale").remove(fisiere);
  for (const id of lead_uri) await stergeClient(id);
});

/** Un client cu fișa plină: un om pe proiect și câte un rând în fiecare tabel al fișei. */
async function clientPlin() {
  const c = await clientDeTest({ caller_id: await idDe("caller") });
  lead_uri.push(c.lead.id);
  const p = c.proiectId;
  const a = admin();
  const om = await idDe("constructor");
  for (const r of [
    await a.from("proiect_oameni").insert({ proiect_id: p, om_id: om, procent: 30 }),
    await a.from("taskuri").insert({ proiect_id: p, titlu: "Un task", om_id: om }),
    await a.from("notite_proiect").insert({ proiect_id: p, text: "O notiță", autor_id: om }),
    await a.from("livrari").insert({ proiect_id: p, titlu: "O livrare" }),
    await a.from("conturi").insert({ proiect_id: p, serviciu: "Vercel", cont: "x", al_cui: "client" }),
    await a.from("materiale").insert({ proiect_id: p, titlu: "Un link", url: "https://exemplu.ro" }),
  ]) {
    if (r.error) throw r.error;
  }
  return c;
}

const TABELE = ["proiect_oameni", "taskuri", "notite_proiect", "livrari", "conturi", "materiale", "evenimente_proiect"] as const;

async function fisier(proiectId: string, nume: string) {
  const cale = `${proiectId}/${randomUUID()}/${nume}`;
  fisiere.push(cale);
  const { error } = await admin().storage.from("materiale").upload(cale, Buffer.from("x"), { contentType: "text/plain" });
  if (error) throw error;
  return cale;
}

describe("ștergerea unui client", () => {
  it("constructorul de pe proiect și callerul clientului nu-l pot șterge", async () => {
    const c = await clientPlin();
    for (const cont of ["constructor", "caller"] as const) {
      const om = await conecteazaCa(cont);
      const sters = await om.from("clienti").delete().eq("id", c.clientId).select("id");
      expect(sters.data ?? [], cont).toHaveLength(0);
      const proiect = await om.from("proiecte").delete().eq("id", c.proiectId).select("id");
      expect(proiect.data ?? [], cont).toHaveLength(0);
    }
    expect((await admin().from("clienti").select("id").eq("id", c.clientId)).data).toHaveLength(1);
  });

  it("sterge_client cerut de constructor sau caller nu șterge nimic, nici lead-ul", async () => {
    const c = await clientPlin();
    for (const cont of ["constructor", "caller"] as const) {
      const r = await (await conecteazaCa(cont)).rpc("sterge_client", { c: c.clientId });
      expect(r.data, cont).not.toBe(true);
    }
    expect((await admin().from("clienti").select("id").eq("id", c.clientId)).data).toHaveLength(1);
    expect((await admin().from("lead_uri").select("id").eq("id", c.lead.id)).data).toHaveLength(1);
  });

  it("sterge_client pe un client care nu există → false", async () => {
    const r = await (await conecteazaCa("admin")).rpc("sterge_client", { c: randomUUID() });
    expect(r.error).toBeNull();
    expect(r.data).toBe(false);
  });

  it("stergeFisiereleProiectului golește și fișierele puse pe alt drum decât cel fix", async () => {
    const c = await clientPlin();
    for (const cale of [`${c.proiectId}/direct.txt`, `${c.proiectId}/${randomUUID()}/a/adanc.txt`]) {
      fisiere.push(cale);
      const { error } = await admin().storage.from("materiale").upload(cale, Buffer.from("x"), { contentType: "text/plain" });
      if (error) throw error;
    }
    await fisier(c.proiectId, "normal.txt");
    expect(await stergeFisiereleProiectului(await conecteazaCa("admin"), c.proiectId)).toBe(true);
    expect((await admin().storage.from("materiale").list(c.proiectId)).data ?? []).toEqual([]);
  });

  it("curataFisiereOrfane golește dosarele proiectelor care nu mai există și le lasă pe celelalte", async () => {
    const orfan = randomUUID(); // un proiect care nu există (ca după „Șterge clientul”)
    const cale = `${orfan}/${randomUUID()}/ramas.txt`;
    fisiere.push(cale);
    const pus = await admin().storage.from("materiale").upload(cale, Buffer.from("x"), { contentType: "text/plain" });
    if (pus.error) throw pus.error;
    const viu = await clientPlin();
    const alViului = await fisier(viu.proiectId, "ramane.txt");

    expect(await curataFisiereOrfane(admin())).toBeGreaterThanOrEqual(1);
    expect((await admin().storage.from("materiale").list(orfan)).data ?? []).toEqual([]);
    expect((await admin().storage.from("materiale").download(alViului)).error).toBeNull();
  });

  it("Adminul șterge lead-ul și clientul: nu rămâne nimic din fișă", async () => {
    const c = await clientPlin();
    for (const t of TABELE) {
      const { data } = await admin().from(t).select("proiect_id").eq("proiect_id", c.proiectId);
      expect(data?.length, `înainte: ${t}`).toBeGreaterThan(0);
    }
    const a = await conecteazaCa("admin");
    const sters = await a.rpc("sterge_client", { c: c.clientId });
    expect(sters.error).toBeNull();
    expect(sters.data).toBe(true);
    expect((await admin().from("clienti").select("id").eq("id", c.clientId)).data).toEqual([]);

    expect((await admin().from("proiecte").select("id").eq("client_id", c.clientId)).data).toEqual([]);
    for (const t of TABELE) {
      const { data } = await admin().from(t).select("proiect_id").eq("proiect_id", c.proiectId);
      expect(data, `după: ${t}`).toEqual([]);
    }
    expect((await admin().from("lead_uri").select("id").eq("id", c.lead.id)).data).toEqual([]);
  });

  it("stergeFisiereleProiectului golește dosarul proiectului, inclusiv fișierele urcate și neconfirmate", async () => {
    const c = await clientPlin();
    const confirmat = await fisier(c.proiectId, "confirmat.txt");
    await fisier(c.proiectId, "neconfirmat.txt");
    await admin().from("materiale").insert({ proiect_id: c.proiectId, titlu: "confirmat.txt", cale: confirmat, marime: 1 });
    const altul = await clientPlin();
    const alAltuia = await fisier(altul.proiectId, "al-altuia.txt");

    const a = await conecteazaCa("admin");
    expect(await stergeFisiereleProiectului(a, c.proiectId)).toBe(true);
    expect((await admin().storage.from("materiale").list(c.proiectId)).data ?? []).toEqual([]);
    // fișierele altui proiect rămân
    expect((await admin().storage.from("materiale").download(alAltuia)).error).toBeNull();
  });

  it("stergeFisiereleProiectului pe un proiect fără fișiere → true", async () => {
    const c = await clientPlin();
    expect(await stergeFisiereleProiectului(await conecteazaCa("admin"), c.proiectId)).toBe(true);
  });
});
