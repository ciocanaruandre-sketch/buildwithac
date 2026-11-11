// Scrie firma demo în baza de TEST (după `cereBazaDeTest()` și `golesteTot()`).
import type { Json } from "../../lib/baza.types";
import type { ContTest } from "../../lib/echipa-test";
import { client, db, verifica, type Ids } from "./baza.mjs";
import { clientiDemo, discutiiDemo, leaduriDemo, telefonDemo, telefonNormDemo, type EvenimentDemo, type LeadDemo, laOra, type Optiuni, ziDupa } from "./demo-date";

const DE_MANA = ["recomandare", "cold_calling", "dm_instagram", "dm_tiktok", "altceva"];

/** Detaliile unui eveniment, cu oamenii traduși în id-uri și orele puse. */
function detalii(e: EvenimentDemo, ids: Ids, extra: { discutie?: string; callback?: string | null; acum?: Date }): Json {
  const d = { ...(e.detalii ?? {}) };
  const id = (c: unknown) => (c ? ids[c as ContTest] : null);
  if (e.tip === "caller" || e.tip === "closer") return { de: id(d.de), in: id(d.in) };
  if (e.tip === "programat") return { closer: id(d.closer), la: extra.discutie ?? (typeof d.discutieAcumZile === "number" ? laOra(extra.acum!, d.discutieAcumZile).toISOString() : null) };
  if (e.tip === "callback") return { la: extra.callback };
  if (e.tip === "om_adaugat") return { om: id(d.om) };
  return d as Json;
}

/** Lead-urile demo: lead, cerere, Parcurs, notițe, discuții. Întoarce lead-urile scrise (cu id-ul lor). */
export async function scrieLeaduriDemo(o: Optiuni, ids: Ids): Promise<(LeadDemo & { id: string })[]> {
  const acum = o.acum.getTime();
  const la = (z: number) => laOra(o.acum, z).toISOString();
  const leaduri = leaduriDemo(o);
  const discutii = new Map(discutiiDemo(o, leaduri).map((d) => [d.nr, d]));
  const scrise: (LeadDemo & { id: string })[] = [];

  for (const l of leaduri) {
    const callback = l.callbackPesteOre === undefined ? null : new Date(acum + l.callbackPesteOre * 3_600_000).toISOString();
    // cheile se dau toate, explicit (o cheie lipsă ar ajunge null, nu valoarea implicită)
    const ins = await db
      .from("lead_uri")
      .insert({
        nume: l.nume,
        telefon: telefonDemo(l.nr),
        telefon_norm: telefonNormDemo(l.nr),
        serviciu: l.serviciu,
        sursa: l.sursa,
        // clientul se face printr-o schimbare de stare, ca trigger-ul să-i facă fișa și primul proiect
        stare: l.stare === "client" ? "oferta_trimisa" : l.stare,
        intrat_la: la(l.acumZile),
        creat_la: la(l.acumZile),
        caller_id: l.caller ? ids[l.caller] : null,
        closer_id: l.closer ? ids[l.closer] : null,
        creat_de: DE_MANA.includes(l.sursa) ? ids.admin : null,
        motiv: l.motiv ?? null,
        callback_la: callback,
        incercari: l.incercari ?? 0,
      })
      .select("id")
      .single();
    if (ins.error) throw ins.error;
    const id = ins.data.id;
    if (l.stare === "client") verifica(await db.from("lead_uri").update({ stare: "client" }).eq("id", id));

    if (l.raspunsuri) verifica(await db.from("cereri").insert({ lead_id: id, sursa: l.sursa, raspunsuri: l.raspunsuri, utm: l.utm ?? {}, primita_la: la(l.acumZile) }));

    const d = discutii.get(l.nr);
    if (d) {
      const programat = l.parcurs.find((e) => e.tip === "programat");
      verifica(
        await db.from("discutii").insert({
          lead_id: id,
          closer_id: ids[l.closer ?? "closer"],
          creat_de: l.caller ? ids[l.caller] : ids.admin,
          creat_la: la(programat?.acumZile ?? 1),
          incepe_la: d.incepe.toISOString(),
          sfarseste_la: new Date(d.incepe.getTime() + d.minute * 60_000).toISOString(),
        }),
      );
    }

    // Parcursul: evenimentele puse de trigger-e acum („acum” peste tot) pleacă; pun la loc pe cele cu zilele lor
    verifica(await db.from("evenimente").delete().eq("lead_id", id));
    verifica(
      await db.from("evenimente").insert(
        l.parcurs.map((e) => ({
          lead_id: id,
          tip: e.tip,
          autor_id: e.autor ? ids[e.autor] : null,
          la: la(e.acumZile),
          detalii: detalii(e, ids, { discutie: d?.incepe.toISOString(), callback, acum: o.acum }),
        })),
      ),
    );
    if (l.notite.length) verifica(await db.from("notite").insert(l.notite.map((n) => ({ lead_id: id, autor_id: ids[n.autor], text: n.text, la: la(n.acumZile) }))));
    scrise.push({ ...l, id });
  }
  return scrise;
}

/** Programul closerului: Ioana are programul din datele de test; în modul singur, și Adminul (L–V, 10–18). */
export async function programDemo(o: Optiuni, ids: Ids) {
  verifica(await db.from("program_closer").delete().eq("closer_id", ids.admin));
  if (!o.singur) return;
  verifica(
    await db.from("program_closer").insert([1, 2, 3, 4, 5].map((zi) => ({ closer_id: ids.admin, zi, de_la: "10:00", pana_la: "18:00" }))),
    await db.from("profiluri").update({ durata_discutie_min: 30 }).eq("id", ids.admin),
  );
}

/** Clienții demo: fișa, proiectele și tot ce e sub ele, cu zilele lor. Lead-urile lor sunt deja „client”. */
export async function scrieClientiDemo(o: Optiuni, ids: Ids): Promise<number> {
  const la = (z: number) => laOra(o.acum, z).toISOString();
  const termen = (n: number | null) => (n === null ? null : ziDupa(o.acum, n));
  const leaduri = leaduriDemo(o);
  let proiecte = 0;

  for (const c of clientiDemo(o)) {
    const l = leaduri.find((x) => x.nr === c.nrLead)!;
    const { clientId, proiectId: primul } = await client(telefonNormDemo(c.nrLead), { nume: l.nume, telefon: telefonDemo(l.nr), serviciu: l.serviciu, sursa: l.sursa });
    verifica(await db.from("clienti").update({ creat_la: la(c.clientDinAcumZile) }).eq("id", clientId));

    for (const [i, p] of c.proiecte.entries()) {
      const camp = {
        titlu: p.titlu,
        serviciu: p.serviciu,
        stadiu: p.stadiu,
        pret_lei: p.pret,
        incasat_lei: p.incasat,
        termen: termen(p.termenPesteZile),
        creat_la: la(p.creatAcumZile),
        inchis_la: p.inchisAcumZile === undefined ? null : la(p.inchisAcumZile),
      };
      let id = primul;
      if (i === 0) verifica(await db.from("proiecte").update(camp).eq("id", primul));
      else {
        const ins = await db.from("proiecte").insert({ ...camp, client_id: clientId, creat_de: ids.admin }).select("id").single();
        if (ins.error) throw ins.error;
        id = ins.data.id;
      }
      proiecte++;

      // omul întâi: task-urile se dau doar cuiva din proiect
      if (p.procentRadu !== undefined) verifica(await db.from("proiect_oameni").upsert({ proiect_id: id, om_id: ids.constructor, procent: p.procentRadu, adaugat_la: la(p.creatAcumZile - 0.1) }));
      const inceput = la(p.creatAcumZile - 0.2);
      verifica(
        await db.from("taskuri").insert(p.taskuri.map((t) => ({ proiect_id: id, titlu: t.titlu, om_id: ids[t.om], termen: termen(t.termenPesteZile), gata: t.gata, creat_de: ids.admin, creat_la: inceput }))),
      );
      if (p.materiale.length)
        verifica(await db.from("materiale").insert(p.materiale.map((m) => ({ proiect_id: id, titlu: m.titlu, url: m.url, nota: m.nota ?? null, adaugat_de: ids[m.om], adaugat_la: inceput }))));
      if (p.conturi.length) verifica(await db.from("conturi").insert(p.conturi.map((x) => ({ proiect_id: id, ...x, adaugat_de: ids.admin, adaugat_la: inceput }))));
      if (p.livrari.length)
        verifica(await db.from("livrari").insert(p.livrari.map((x) => ({ proiect_id: id, titlu: x.titlu, link: x.link, nota: x.nota ?? null, stare: x.stare, adaugat_de: ids.admin, adaugat_la: la(x.acumZile) }))));
      if (p.notite.length) verifica(await db.from("notite_proiect").insert(p.notite.map((n) => ({ proiect_id: id, autor_id: ids[n.autor], text: n.text, la: la(n.acumZile) }))));

      // Parcursul proiectului: pleacă ce au pus trigger-ele acum, vin evenimentele cu zilele lor
      verifica(await db.from("evenimente_proiect").delete().eq("proiect_id", id));
      verifica(await db.from("evenimente_proiect").insert(p.parcurs.map((e) => ({ proiect_id: id, tip: e.tip, autor_id: e.autor ? ids[e.autor] : null, la: la(e.acumZile), detalii: detalii(e, ids, {}) }))));
    }
  }
  return proiecte;
}
