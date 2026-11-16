import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cripteaza, decripteaza } from "@/lib/calendar/criptare";
import { deconecteaza, golesteCoada, ocupatGoogle, salveazaConexiune, stareRand } from "@/lib/calendar/coada";
import { idEveniment } from "@/lib/calendar/google";
import { admin, idDe, leadDeTest, omTemporar, sterge, stergeTemporari } from "./ajutor";

if (!process.env.GOOGLE_CHEIE_CRIPTARE) process.env.GOOGLE_CHEIE_CRIPTARE = randomBytes(32).toString("base64");

type Apel = { metoda: string; url: string; corp: string };
type Regula = (a: Apel) => Response | Error | undefined;

/**
 * Google fals: token → a1; POST eveniment → id-ul trimis (409 dacă există deja) sau ev-<n>; PATCH → același id;
 * DELETE → 204; revoke → 200. `creat` ține minte evenimentele create. Regulile pot schimba răspunsul.
 */
function google(...reguli: Regula[]) {
  const apeluri: Apel[] = [];
  const creat = new Set<string>();
  let n = 0;
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const a = { metoda: init?.method ?? "GET", url: String(input), corp: typeof init?.body === "string" ? init.body : "" };
    apeluri.push(a);
    await new Promise((r) => setTimeout(r, 30));
    for (const regula of reguli) {
      const r = regula(a);
      if (r instanceof Error) throw r;
      if (r) return r;
    }
    if (a.url.includes("/token")) return Response.json({ access_token: "a1" });
    if (a.url.includes("/revoke")) return new Response(null, { status: 200 });
    if (a.url.endsWith("/freeBusy")) return Response.json({ calendars: { primary: { busy: [{ start: "2026-12-01T10:00:00Z", end: "2026-12-01T11:00:00Z" }] } } });
    if (a.metoda === "POST") {
      const id = (JSON.parse(a.corp || "{}") as { id?: string }).id ?? `ev-${++n}`;
      if (creat.has(id)) return Response.json({ error: { code: 409 } }, { status: 409 });
      creat.add(id);
      return Response.json({ id });
    }
    if (a.metoda === "PATCH") return Response.json({ id: a.url.split("/").pop() });
    if (a.metoda === "DELETE") return new Response(null, { status: 204 });
    throw new Error(`Google fals: n-am răspuns pentru ${a.metoda} ${a.url}`);
  }) as typeof fetch;
  const evenimente = () => apeluri.filter((a) => a.url.includes("/events"));
  return { f, apeluri, evenimente, creat };
}

const run = Date.now();
const r = () => run % 97;
const lead: string[] = [];
const discutii: string[] = [];
let closer = "";

const peste = (zile: number, ora: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + zile);
  d.setUTCHours(ora, 0, 0, 0);
  return d.toISOString();
};
const plus30 = (iso: string) => new Date(new Date(iso).getTime() + 30 * 60_000).toISOString();

async function conecteaza(om: string, refresh = "r1") {
  await admin().from("google_conexiuni").delete().eq("om_id", om);
  const { error } = await admin().from("google_conexiuni").insert({ om_id: om, email: `test-${run}@exemplu.ro`, refresh_criptat: cripteaza(refresh) });
  if (error) throw error;
}

async function discutieNoua(om: string, la: string) {
  const l = await leadDeTest({ stare: "programat", closer_id: om, nume: "Cafeneaua Colț" });
  lead.push(l.id);
  const { data, error } = await admin().from("discutii").insert({ lead_id: l.id, closer_id: om, incepe_la: la, sfarseste_la: plus30(la) }).select("id").single();
  if (error) throw error;
  discutii.push(data.id);
  return data.id;
}

const discutie = async (id: string) => (await admin().from("discutii").select("google_event_id, google_om_id, calendar_stare").eq("id", id).single()).data!;
const coada = async (id: string) => (await admin().from("calendar_coada").select("*").eq("discutie_id", id)).data!;

beforeAll(async () => {
  closer = await idDe("closer");
});
afterAll(async () => {
  for (const id of lead) await sterge(id);
  if (discutii.length) await admin().from("calendar_coada").delete().in("discutie_id", discutii);
  await admin().from("calendar_coada").delete().like("event_id", "ev-%");
  if (discutii.length) await admin().from("calendar_coada").delete().in("event_id", discutii.map(idEveniment));
  await admin().from("google_conexiuni").delete().eq("email", `test-${run}@exemplu.ro`);
  await stergeTemporari();
});

describe("coada calendarului", () => {
  it("scrie creează evenimentul", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(150 + r(), 6));
    const g = google();
    const rez = await golesteCoada(admin(), g.f, { discutie: id });
    expect(rez).toEqual({ facute: 1, esuate: 0 });
    expect(new URLSearchParams(g.apeluri[0].corp).get("refresh_token")).toBe("r1");
    const post = g.evenimente();
    expect(post.map((a) => a.metoda)).toEqual(["POST"]);
    expect(JSON.parse(post[0].corp).summary).toBe("Discuție · Cafeneaua Colț");
    expect(JSON.parse(post[0].corp).id).toBe(idEveniment(id));
    expect(await discutie(id)).toEqual({ google_event_id: idEveniment(id), google_om_id: closer, calendar_stare: "ok" });
    expect(await coada(id)).toEqual([]);

    // reprogramarea face PATCH pe același eveniment
    const la = peste(151 + r(), 7);
    await admin().from("discutii").update({ incepe_la: la, sfarseste_la: plus30(la) }).eq("id", id);
    expect((await discutie(id)).calendar_stare).toBeNull();
    const g2 = google();
    await golesteCoada(admin(), g2.f, { discutie: id });
    expect(g2.evenimente().map((a) => `${a.metoda} ${a.url.split("/").pop()}`)).toEqual([`PATCH ${idEveniment(id)}`]);
    expect((await discutie(id)).calendar_stare).toBe("ok");
  });

  it("Google aruncă: eroare, rândul rămâne, a doua oară merge", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(250 + r(), 6));
    const rau = google(() => new Error("rețea"));
    expect(await golesteCoada(admin(), rau.f, { discutie: id })).toEqual({ facute: 0, esuate: 1 });
    expect((await discutie(id)).calendar_stare).toBe("eroare");
    const [rand] = await coada(id);
    expect(rand.incercari).toBe(1);
    expect(rand.ultima_eroare).toBeTruthy();

    // imediat după, rândul așteaptă (4 minute după prima eroare)
    const g = google();
    expect(await golesteCoada(admin(), g.f, { discutie: id })).toEqual({ facute: 0, esuate: 0 });
    expect(g.apeluri).toEqual([]);

    await admin().from("calendar_coada").update({ luat_la: new Date(Date.now() - 5 * 60_000).toISOString() }).eq("discutie_id", id);
    await golesteCoada(admin(), google().f, { discutie: id });
    expect((await discutie(id)).calendar_stare).toBe("ok");
    expect(await coada(id)).toEqual([]);
  });

  it("rândurile care pică des așteaptă tot mai mult, trec după cele noi și, după 10 încercări, se opresc", async () => {
    const om = await omTemporar("closer");
    await conecteaza(om);
    const vechi = await discutieNoua(om, peste(1350 + r(), 6));
    const nou = await discutieNoua(om, peste(1350 + r(), 8));
    const mort = await discutieNoua(om, peste(1350 + r(), 10));
    const acum = (minute: number) => new Date(Date.now() - minute * 60_000).toISOString();
    // a picat de 3 ori, ultima dată acum 20 de minute (așteaptă 16): poate fi luat, dar după cel nou
    await admin().from("calendar_coada").update({ incercari: 3, luat_la: acum(20) }).eq("discutie_id", vechi);
    await admin().from("calendar_coada").update({ incercari: 10, luat_la: acum(3 * 24 * 60) }).eq("discutie_id", mort);
    const g = google();
    expect(await golesteCoada(admin(), g.f, { om, limita: 1 })).toEqual({ facute: 1, esuate: 0 });
    expect((await discutie(nou)).calendar_stare).toBe("ok");
    expect(await golesteCoada(admin(), g.f, { om })).toEqual({ facute: 1, esuate: 0 });
    expect((await discutie(vechi)).calendar_stare).toBe("ok");
    expect(await coada(mort)).toHaveLength(1);

    // a picat de 3 ori acum 10 minute: încă așteaptă
    const alta = await discutieNoua(om, peste(1350 + r(), 12));
    await admin().from("calendar_coada").update({ incercari: 3, luat_la: acum(10) }).eq("discutie_id", alta);
    expect(await golesteCoada(admin(), g.f, { discutie: alta })).toEqual({ facute: 0, esuate: 0 });

    // repus în coadă (ora schimbată), cel oprit pornește de la zero
    const la = peste(1360 + r(), 10);
    await admin().from("discutii").update({ incepe_la: la, sfarseste_la: plus30(la) }).eq("id", mort);
    expect((await coada(mort))[0]).toMatchObject({ incercari: 0, luat_la: null });
    await admin().from("google_conexiuni").delete().eq("om_id", om);
  });

  it("invalid_grant: legătura cade, discuția are eroare", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(350 + r(), 6));
    const g = google((a) => (a.url.includes("/token") ? Response.json({ error: "invalid_grant" }, { status: 400 }) : undefined));
    await golesteCoada(admin(), g.f, { discutie: id });
    const { data } = await admin().from("google_conexiuni").select("stare").eq("om_id", closer).single();
    expect(data!.stare).toBe("cazut");
    expect((await discutie(id)).calendar_stare).toBe("eroare");
    expect(await coada(id)).toHaveLength(1);

    // cu legătura căzută, nu se mai întreabă Google
    await admin().from("calendar_coada").update({ luat_la: null }).eq("discutie_id", id);
    const g2 = google();
    await golesteCoada(admin(), g2.f, { discutie: id });
    expect(g2.apeluri).toEqual([]);
    expect(await coada(id)).toHaveLength(1);
  });

  it("fără conexiune: neconectat, coada goală, niciun apel", async () => {
    const om = await omTemporar("closer");
    const id = await discutieNoua(om, peste(450 + r(), 6));
    const g = google();
    await golesteCoada(admin(), g.f, { discutie: id });
    expect(g.apeluri).toEqual([]);
    expect((await discutie(id)).calendar_stare).toBe("neconectat");
    expect(await coada(id)).toEqual([]);
  });

  it("două goliri în paralel fac un singur POST", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(550 + r(), 6));
    const g = google();
    await Promise.all([golesteCoada(admin(), g.f, { discutie: id }), golesteCoada(admin(), g.f, { discutie: id })]);
    expect(g.evenimente().filter((a) => a.metoda === "POST")).toHaveLength(1);
  });

  it("evenimentul rămas în calendarul altuia: se șterge acolo, se creează la closer", async () => {
    await conecteaza(closer);
    const altul = await omTemporar("closer");
    const id = await discutieNoua(closer, peste(650 + r(), 6));
    await admin().from("discutii").update({ google_event_id: `ev-vechi-${run}`, google_om_id: altul }).eq("id", id);
    const g = google();
    await golesteCoada(admin(), g.f, { discutie: id });
    expect(g.evenimente().map((a) => a.metoda)).toEqual(["POST"]);
    expect((await discutie(id)).google_om_id).toBe(closer);
    const { data } = await admin().from("calendar_coada").select("actiune, om_id").eq("event_id", `ev-vechi-${run}`);
    expect(data).toEqual([{ actiune: "sterge", om_id: altul }]);
    await admin().from("calendar_coada").delete().eq("event_id", `ev-vechi-${run}`);
  });

  it("discuția ștearsă cât se crea evenimentul: evenimentul se șterge pe loc", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(750 + r(), 6));
    const g = google();
    // discuția dispare chiar în timp ce Google creează evenimentul
    const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST" && String(input).endsWith("/events")) await admin().from("discutii").delete().eq("id", id);
      return g.f(input, init);
    }) as typeof fetch;
    await golesteCoada(admin(), f, { discutie: id });
    expect(g.evenimente().map((a) => a.metoda)).toEqual(["POST", "DELETE"]);
  });

  it("„Reîncearcă” cât alt server creează evenimentul: tot un singur eveniment", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(1050 + r(), 6));
    // Google lent la creare: primul server ține rândul cât așteaptă
    const g = google();
    let inZbor: () => void = () => undefined;
    const aPornit = new Promise<void>((rez) => (inZbor = rez));
    const lent = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST" && String(input).endsWith("/events")) {
        inZbor();
        await new Promise((rez) => setTimeout(rez, 600));
      }
      return g.f(input, init);
    }) as typeof fetch;
    const primul = golesteCoada(admin(), lent, { discutie: id });
    await aPornit;
    // „Reîncearcă” eliberează rândul și golește din nou, cât primul încă așteaptă
    await admin().from("calendar_coada").update({ luat_la: null }).eq("discutie_id", id);
    const alDoilea = golesteCoada(admin(), g.f, { discutie: id });
    await Promise.all([primul, alDoilea]);
    expect([...g.creat]).toEqual([idEveniment(id)]);
    expect((await discutie(id)).google_event_id).toBe(idEveniment(id));
  });

  it("cu termenul depășit nu mai ia rânduri și le lasă libere", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(1150 + r(), 6));
    const g = google();
    expect(await golesteCoada(admin(), g.f, { discutie: id, pana: Date.now() - 1 })).toEqual({ facute: 0, esuate: 0 });
    expect(g.apeluri).toEqual([]);
    const [rand] = await coada(id);
    expect(rand.luat_la).toBeNull();
  });

  it("rândul de pe fișă: o discuție de dinainte, fără loc în coadă, intră în coadă (nu rămâne roșie)", async () => {
    const id = await discutieNoua(closer, peste(1250 + r(), 6));
    await admin().from("calendar_coada").delete().eq("discutie_id", id);
    const veche = { id, calendar_stare: null, creat_la: new Date(Date.now() - 3_600_000).toISOString() };
    expect(await stareRand(admin(), veche, new Date())).toBeNull();
    expect((await coada(id)).map((x) => x.actiune)).toEqual(["scrie"]);
    // rândul din coadă are acum peste 2 minute: abia atunci „eroare”
    await admin().from("calendar_coada").update({ creat_la: new Date(Date.now() - 3 * 60_000).toISOString() }).eq("discutie_id", id);
    expect(await stareRand(admin(), veche, new Date())).toBe("eroare");
    expect(await stareRand(admin(), { ...veche, calendar_stare: "neconectat" }, new Date())).toBe("neconectat");
  });

  it("deconecteaza șterge toate evenimentele, și pe cele trecute", async () => {
    await conecteaza(closer);
    const viitoare = await discutieNoua(closer, peste(850 + r(), 6));
    const trecuta = await discutieNoua(closer, peste(-300 - r(), 6));
    await admin().from("calendar_coada").delete().in("discutie_id", [viitoare, trecuta]);
    await admin().from("discutii").update({ google_event_id: `ev-v-${run}`, google_om_id: closer, calendar_stare: "ok" }).eq("id", viitoare);
    await admin().from("discutii").update({ google_event_id: `ev-t-${run}`, google_om_id: closer, calendar_stare: "ok" }).eq("id", trecuta);
    const g = google();
    expect(await deconecteaza(admin(), closer, g.f)).toEqual({ nesterse: 0 });
    const sterse = g.evenimente().filter((a) => a.metoda === "DELETE").map((a) => a.url.split("/").pop());
    expect(sterse).toEqual(expect.arrayContaining([`ev-v-${run}`, `ev-t-${run}`]));
    expect(g.apeluri.filter((a) => a.url.includes("/revoke"))).toHaveLength(1);
    expect((await admin().from("google_conexiuni").select("om_id").eq("om_id", closer)).data).toEqual([]);
    expect(await discutie(viitoare)).toEqual({ google_event_id: null, google_om_id: null, calendar_stare: "neconectat" });
    expect((await discutie(trecuta)).google_event_id).toBeNull();
  });

  it("deconecteaza numără ce n-a putut șterge, dar se deconectează oricum", async () => {
    await conecteaza(closer);
    const id = await discutieNoua(closer, peste(950 + r(), 6));
    await admin().from("calendar_coada").delete().eq("discutie_id", id);
    await admin().from("discutii").update({ google_event_id: `ev-rau-${run}`, google_om_id: closer, calendar_stare: "ok" }).eq("id", id);
    const g = google((a) => (a.metoda === "DELETE" && a.url.endsWith(`ev-rau-${run}`) ? new Response(null, { status: 500 }) : undefined));
    expect(await deconecteaza(admin(), closer, g.f)).toEqual({ nesterse: 1 });
    expect((await admin().from("google_conexiuni").select("om_id").eq("om_id", closer)).data).toEqual([]);
    expect((await discutie(id)).google_event_id).toBeNull();
  });

  it("deconecteaza nu mai creează în Google ce urmează să șteargă", async () => {
    const om = await omTemporar("closer");
    const altul = await omTemporar("closer");
    await conecteaza(om);
    // una abia programată (în coadă, încă nu în Google), una venită de la alt closer, cu evenimentul la acela
    const noua = await discutieNoua(om, peste(1450 + r(), 6));
    const venita = await discutieNoua(om, peste(1450 + r(), 8));
    await admin().from("discutii").update({ google_event_id: `ev-venit-${run}`, google_om_id: altul }).eq("id", venita);
    const g = google();
    expect(await deconecteaza(admin(), om, g.f)).toEqual({ nesterse: 0 });
    expect(g.evenimente().filter((a) => a.metoda !== "DELETE")).toEqual([]);
    expect(await coada(noua)).toEqual([]);
    expect(await coada(venita)).toEqual([]);
    expect((await discutie(noua)).calendar_stare).toBe("neconectat");
    expect(await discutie(venita)).toEqual({ google_event_id: null, google_om_id: null, calendar_stare: "neconectat" });
    // evenimentul din calendarul celuilalt se șterge acolo
    const { data } = await admin().from("calendar_coada").select("actiune, om_id").eq("event_id", `ev-venit-${run}`);
    expect(data).toEqual([{ actiune: "sterge", om_id: altul }]);
  });

  it("reconectarea cu alt cont Google retrage cheia veche; cu același cont, nu; ștergerile omului pornesc din nou", async () => {
    const om = await omTemporar("closer");
    await conecteaza(om, "vechi");
    await admin().from("calendar_coada").insert({ actiune: "sterge", om_id: om, event_id: `ev-rec-${run}`, incercari: 5, luat_la: new Date().toISOString() });
    const g = google();
    await salveazaConexiune(admin(), om, { refresh: "nou", email: `alt-${run}@exemplu.ro` }, g.f);
    const revocate = () => g.apeluri.filter((a) => a.url.includes("/revoke")).map((a) => new URL(a.url).searchParams.get("token"));
    expect(revocate()).toEqual(["vechi"]);
    await salveazaConexiune(admin(), om, { refresh: "nou2", email: `alt-${run}@exemplu.ro` }, g.f);
    expect(revocate()).toEqual(["vechi"]);
    const { data: con } = await admin().from("google_conexiuni").select("refresh_criptat, email, stare").eq("om_id", om).single();
    expect(decripteaza(con!.refresh_criptat)).toBe("nou2");
    expect(con).toMatchObject({ email: `alt-${run}@exemplu.ro`, stare: "ok" });
    const { data: rand } = await admin().from("calendar_coada").select("incercari, luat_la").eq("event_id", `ev-rec-${run}`).single();
    expect(rand).toEqual({ incercari: 0, luat_la: null });
    await admin().from("calendar_coada").delete().eq("event_id", `ev-rec-${run}`);
    await admin().from("google_conexiuni").delete().eq("om_id", om);
  });

  it("ocupatGoogle: ok, neconectat, nu_pot", async () => {
    await conecteaza(closer);
    const de = new Date("2026-12-01T00:00:00Z");
    const pana = new Date("2026-12-15T00:00:00Z");
    expect(await ocupatGoogle(admin(), closer, de, pana, google().f)).toEqual({
      stare: "ok",
      ocupate: [{ de: new Date("2026-12-01T10:00:00Z"), pana: new Date("2026-12-01T11:00:00Z") }],
    });
    expect(await ocupatGoogle(admin(), await omTemporar("closer"), de, pana, google().f)).toEqual({ stare: "neconectat" });
    expect(await ocupatGoogle(admin(), closer, de, pana, google(() => new Error("rețea")).f)).toEqual({ stare: "nu_pot" });

    const cazut = google((a) => (a.url.includes("/token") ? Response.json({ error: "invalid_grant" }, { status: 400 }) : undefined));
    expect(await ocupatGoogle(admin(), closer, de, pana, cazut.f)).toEqual({ stare: "nu_pot" });
    expect((await admin().from("google_conexiuni").select("stare").eq("om_id", closer).single()).data!.stare).toBe("cazut");
    await admin().from("google_conexiuni").delete().eq("om_id", closer);
  });
});
