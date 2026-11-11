// Scrie firma demo în baza de TEST (după `cereBazaDeTest()` și `golesteTot()`).
import type { Json } from "../../lib/baza.types";
import type { ContTest } from "../../lib/echipa-test";
import { db, verifica, type Ids } from "./baza.mjs";
import { discutiiDemo, leaduriDemo, telefonDemo, telefonNormDemo, type EvenimentDemo, type LeadDemo, type Optiuni } from "./demo-date";

const ZI = 86_400_000;
const DE_MANA = ["recomandare", "cold_calling", "dm_instagram", "dm_tiktok", "altceva"];

/** Detaliile unui eveniment, cu oamenii traduși în id-uri și orele puse. */
function detalii(e: EvenimentDemo, ids: Ids, extra: { discutie?: string; callback?: string | null }): Json {
  const d = { ...(e.detalii ?? {}) };
  const id = (c: unknown) => (c ? ids[c as ContTest] : null);
  if (e.tip === "caller" || e.tip === "closer") return { de: id(d.de), in: id(d.in) };
  if (e.tip === "programat") return { closer: id(d.closer), la: extra.discutie };
  if (e.tip === "callback") return { la: extra.callback };
  return d as Json;
}

/** Lead-urile demo: lead, cerere, Parcurs, notițe, discuții. Întoarce lead-urile scrise (cu id-ul lor). */
export async function scrieLeaduriDemo(o: Optiuni, ids: Ids): Promise<(LeadDemo & { id: string })[]> {
  const acum = o.acum.getTime();
  const la = (z: number) => new Date(acum - z * ZI).toISOString();
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
          detalii: detalii(e, ids, { discutie: d?.incepe.toISOString(), callback }),
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
