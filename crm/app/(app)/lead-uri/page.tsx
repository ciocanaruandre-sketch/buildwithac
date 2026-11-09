import Link from "next/link";
import { ButoaneRand } from "@/components/ButoaneRand";
import { CULOARE_STARE, cand } from "@/lib/afisare";
import { cerRol } from "@/lib/eu";
import { ETICHETE_PERIOADA, ETICHETE_SCURTATURA, PERIOADE, SCURTATURI, cautareTelefon, dinParametri, intervalPerioada, spreParametri } from "@/lib/filtre";
import { supabase } from "@/lib/supabase/server";
import { laOraRomaniei, ziuaPeste, ziuaRomaniei } from "@/lib/timp";
import { ETICHETE, SERVICII, STARI, SURSE, type Stare } from "@/lib/tipuri";

const PE_PAGINA = 50;
const NUMARATE: Stare[] = ["nou", "fara_raspuns", "callback", "programat", "oferta_trimisa"];

export default async function LeadUri({ searchParams }: PageProps<"/lead-uri">) {
  const om = await cerRol("admin", "caller", "closer");
  const f = dinParametri(await searchParams);
  const db = await supabase();
  const acum = new Date();

  const { data: oameni } = await db.from("profiluri").select("id, nume, rol").in("rol", ["admin", "caller", "closer"]).order("nume");
  const numeOm = new Map((oameni ?? []).map((o) => [o.id, o.nume]));

  // numărătoarea de sus: toate lead-urile, pe stări
  const numarate = await Promise.all(NUMARATE.map((s) => db.from("lead_uri").select("id", { count: "exact", head: true }).eq("stare", s)));

  let q = db.from("lead_uri").select("id, nume, telefon, telefon_norm, email, serviciu, sursa, stare, callback_la, intrat_la, caller_id, closer_id", { count: "exact" });
  if (f.q) {
    const curat = f.q.replace(/[,()%*\\]/g, " ").trim();
    const tel = cautareTelefon(f.q);
    const conditii = [`nume.ilike.%${curat}%`, `email_norm.ilike.%${curat.toLowerCase()}%`];
    if (tel) conditii.push(`telefon_norm.like.%${tel}%`);
    q = q.or(conditii.join(","));
  }
  const { de, pana } = intervalPerioada(f.perioada, acum);
  if (de) q = q.gte("intrat_la", de.toISOString());
  if (pana) q = q.lt("intrat_la", pana.toISOString());
  if (f.stare) q = q.eq("stare", f.stare);
  if (f.sursa) q = q.eq("sursa", f.sursa);
  if (f.serviciu) q = q.eq("serviciu", f.serviciu);
  if (f.om === "liber") q = q.is("caller_id", null);
  else if (f.om && numeOm.has(f.om)) q = q.or(`caller_id.eq.${f.om},closer_id.eq.${f.om}`);

  const azi = ziuaRomaniei(acum);
  const dupaOra = f.scurtatura === "callback_azi" || f.scurtatura === "callback_intarziat";
  if (f.scurtatura === "callback_azi") q = q.eq("stare", "callback").gte("callback_la", laOraRomaniei(azi, "00:00").toISOString()).lt("callback_la", laOraRomaniei(ziuaPeste(acum, 1), "00:00").toISOString());
  if (f.scurtatura === "callback_intarziat") q = q.eq("stare", "callback").lt("callback_la", acum.toISOString());
  if (f.scurtatura === "nesunate") q = q.eq("stare", "nou");
  if (f.scurtatura === "ale_mele") q = q.or(`caller_id.eq.${om.id},closer_id.eq.${om.id}`);

  q = dupaOra ? q.order("callback_la", { ascending: true }) : q.order("intrat_la", { ascending: false });
  const start = (f.pagina - 1) * PE_PAGINA;
  const { data: leaduri, count } = await q.range(start, start + PE_PAGINA - 1);
  const total = count ?? 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="lbl mb-1.5">CRM</p>
          <h1 className="text-[26px] font-bold">Lead-uri</h1>
        </div>
        <Link href="/lead-uri/nou" className="btn pri">
          + Lead de mână
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {NUMARATE.map((s, i) => (
          <Link
            key={s}
            href={`/lead-uri${spreParametri({ perioada: "tot", pagina: 1 }, { stare: f.stare === s ? undefined : s })}`}
            className={`panel px-3.5 py-3 ${f.stare === s ? "!border-amber" : ""}`}
            aria-label={`${ETICHETE.stare[s]} ${numarate[i].count ?? 0}`}
          >
            <span className="lbl block">{ETICHETE.stare[s]}</span>
            <b className="font-mono text-[22px] font-medium">{numarate[i].count ?? 0}</b>
          </Link>
        ))}
      </div>

      <form className="mb-3 flex flex-wrap gap-2" action="/lead-uri">
        <input className="camp !w-full sm:!w-64" name="q" defaultValue={f.q} placeholder="Nume, telefon sau e-mail" aria-label="Caută" />
        <select className="camp !w-auto" name="perioada" defaultValue={f.perioada} aria-label="Perioada">
          {PERIOADE.map((p) => (
            <option key={p} value={p}>{ETICHETE_PERIOADA[p]}</option>
          ))}
        </select>
        <select className="camp !w-auto" name="stare" defaultValue={f.stare ?? ""} aria-label="Starea">
          <option value="">Orice stare</option>
          {STARI.map((s) => (
            <option key={s} value={s}>{ETICHETE.stare[s]}</option>
          ))}
        </select>
        <select className="camp !w-auto" name="sursa" defaultValue={f.sursa ?? ""} aria-label="Sursa">
          <option value="">Orice sursă</option>
          {SURSE.map((s) => (
            <option key={s} value={s}>{ETICHETE.sursa[s]}</option>
          ))}
        </select>
        <select className="camp !w-auto" name="serviciu" defaultValue={f.serviciu ?? ""} aria-label="Serviciul">
          <option value="">Orice serviciu</option>
          {SERVICII.map((s) => (
            <option key={s} value={s}>{ETICHETE.serviciu[s]}</option>
          ))}
        </select>
        <select className="camp !w-auto" name="om" defaultValue={f.om ?? ""} aria-label="Omul">
          <option value="">Oricine</option>
          <option value="liber">Liber (fără caller)</option>
          {(oameni ?? []).map((o) => (
            <option key={o.id} value={o.id}>{o.nume}</option>
          ))}
        </select>
        {f.scurtatura && <input type="hidden" name="scurtatura" value={f.scurtatura} />}
        <button className="btn">Filtrează</button>
        {spreParametri(f) && (
          <Link href="/lead-uri" className="btn">
            Șterge filtrele
          </Link>
        )}
      </form>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {SCURTATURI.map((s) => (
          <Link key={s} href={`/lead-uri${spreParametri(f, { scurtatura: f.scurtatura === s ? undefined : s, pagina: 1 })}`} className={`chip ${f.scurtatura === s ? "amber" : ""}`}>
            {ETICHETE_SCURTATURA[s]}
          </Link>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left">
              {["Nume", "Serviciu", "Sursă", "Stare", "Callback", "Intrat", "Caller", ""].map((t) => (
                <th key={t} className="lbl px-3.5 py-2.5 font-semibold">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(leaduri ?? []).map((l) => {
              const intarziat = l.stare === "callback" && l.callback_la && new Date(l.callback_la) < acum;
              return (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-3.5 py-2.5">
                    <Link href={`/lead-uri/${l.id}`} className="font-medium hover:text-amber">{l.nume}</Link>
                    <span className="block font-mono text-[11px] text-ink-3">{l.telefon ?? l.email}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-2">{ETICHETE.serviciu[l.serviciu]}</td>
                  <td className="px-3.5 py-2.5 text-ink-2">{ETICHETE.sursa[l.sursa]}</td>
                  <td className="px-3.5 py-2.5"><span className={`chip ${CULOARE_STARE[l.stare]}`}>{ETICHETE.stare[l.stare]}</span></td>
                  <td className={`px-3.5 py-2.5 font-mono text-[12px] ${intarziat ? "text-[#ff7a66]" : "text-ink-2"}`}>{l.stare === "callback" && l.callback_la ? cand(l.callback_la, acum) : "—"}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[12px] text-ink-3">{cand(l.intrat_la, acum)}</td>
                  <td className="px-3.5 py-2.5 text-ink-2">{l.caller_id ? numeOm.get(l.caller_id) ?? "—" : <span className="text-ink-3">liber</span>}</td>
                  <td className="px-3.5 py-2">
                    <ButoaneRand id={l.id} telefon={l.telefon} telefonNorm={l.telefon_norm} liber={!l.caller_id} />
                  </td>
                </tr>
              );
            })}
            {!leaduri?.length && (
              <tr>
                <td colSpan={8} className="px-3.5 py-8 text-center text-ink-3">Niciun lead pe filtrele astea.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PE_PAGINA && (
        <div className="mt-3 flex items-center gap-2 font-mono text-[12px] text-ink-3">
          {f.pagina > 1 && <Link className="btn" href={`/lead-uri${spreParametri(f, { pagina: f.pagina - 1 })}`}>Înapoi</Link>}
          <span>
            {start + 1}–{Math.min(start + PE_PAGINA, total)} din {total}
          </span>
          {start + PE_PAGINA < total && <Link className="btn" href={`/lead-uri${spreParametri(f, { pagina: f.pagina + 1 })}`}>Înainte</Link>}
        </div>
      )}
    </>
  );
}
