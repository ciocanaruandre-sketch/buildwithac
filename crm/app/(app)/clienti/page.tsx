import { BaraSus } from "@/components/BaraSus";
import Link from "next/link";
import { cand, termenScurt, ziScurta } from "@/lib/afisare";
import { eu, type Eu } from "@/lib/eu";
import { progres } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { ziuaRomaniei } from "@/lib/timp";
import { ETICHETE, STADII } from "@/lib/tipuri";

const titlu = (
  <>
    <BaraSus cale={[{ eticheta: "Clienți" }]} />
    <h1 className="mb-4 text-[26px] leading-tight sm:text-[30px]">Clienți</h1>
  </>
);

const gol = (text: string) => <p className="panel px-4 py-6 text-[14px] text-ink-2">{text}</p>;

/** Ce vede fiecare hotărăște RLS. Adminul și constructorul văd proiectele; callerul și closerul, lista clienților lor. */
export default async function Clienti() {
  const om = await eu();
  return (
    <>
      {titlu}
      {om.rol === "admin" || om.rol === "constructor" ? <Proiecte om={om} /> : <ClientiiMei />}
    </>
  );
}

/** Un rând pe proiect: stadiul, progresul, termenul și cine lucrează. */
async function Proiecte({ om }: { om: Eu }) {
  const db = await supabase();
  const eAdmin = om.rol === "admin";
  const [{ data: proiecte }, { data: taskuri }, { data: profiluri }, { data: randuri }] = await Promise.all([
    db.from("proiecte").select("id, titlu, stadiu, termen, inchis_la, creat_la, client_id, clienti (nume, telefon, email, creat_la)").order("creat_la", { ascending: false }),
    db.from("taskuri").select("proiect_id, gata"),
    db.from("profiluri").select("id, nume"),
    db.from("proiect_oameni").select("proiect_id, om_id"),
  ]);
  if (!proiecte?.length) {
    return gol(eAdmin ? "Încă niciun client. Apare aici când un closer marchează „Client” pe un lead." : "Aici apar clienții la care lucrezi, după ce te pune Andrei pe un proiect.");
  }

  // constructorul își vede în proiect_oameni doar rândul lui: colegii vin din oameni_proiect
  const peProiect = new Map<string, string[]>();
  if (eAdmin) {
    for (const r of randuri ?? []) peProiect.set(r.proiect_id, [...(peProiect.get(r.proiect_id) ?? []), r.om_id]);
  } else {
    const colegi = await Promise.all(proiecte.map((p) => db.rpc("oameni_proiect", { p: p.id })));
    proiecte.forEach((p, i) => peProiect.set(p.id, (colegi[i].data ?? []).map((r) => r.om_id)));
  }
  const numeOm = new Map((profiluri ?? []).map((o) => [o.id, o.nume]));
  const lucreaza = (id: string) =>
    (peProiect.get(id) ?? [])
      .map((x) => numeOm.get(x) ?? "cineva")
      .sort((a, b) => a.localeCompare(b, "ro"))
      .join(", ") || "—";

  const azi = ziuaRomaniei(new Date());
  const inainteDeLivrat = (stadiu: (typeof STADII)[number]) => STADII.indexOf(stadiu) < STADII.indexOf("livrat");
  // proiectele închise la coadă; restul rămân în ordinea din bază (cele mai noi sus)
  const ordonate = [...proiecte].sort((a, b) => Number(Boolean(a.inchis_la)) - Number(Boolean(b.inchis_la)));

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line text-left">
            {["Client", "Proiect", "Stadiu", "Progres", "Predare", "Lucrează", "Client din"].map((t) => (
              <th key={t} className="lbl px-3.5 py-2.5 font-semibold">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordonate.map((p) => {
            const pr = progres((taskuri ?? []).filter((t) => t.proiect_id === p.id));
            const trecut = Boolean(p.termen && p.termen < azi && !p.inchis_la && inainteDeLivrat(p.stadiu));
            return (
              <tr key={p.id} className={`border-b border-line last:border-0 ${p.inchis_la ? "opacity-60" : ""}`}>
                <td className="px-3.5 py-2.5">
                  <Link href={{ pathname: `/clienti/${p.client_id}`, query: { proiect: p.id } }} className="font-medium hover:text-amber">
                    {p.clienti.nume}
                  </Link>
                  <span className="block num text-[12px] text-ink-3">{p.clienti.telefon ?? p.clienti.email}</span>
                </td>
                <td className="px-3.5 py-2.5 text-ink-2">{p.titlu}</td>
                <td className="px-3.5 py-2.5">
                  {p.inchis_la ? <span className="chip red">Închis</span> : <span className="chip amber">{ETICHETE.stadiu[p.stadiu]}</span>}
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-[88px] overflow-hidden rounded-full bg-bg-3">
                      <i className="block h-full" style={{ width: `${pr.procent}%`, background: "var(--grad)" }} />
                    </div>
                    <span className="num text-[12px] text-ink-3">
                      {pr.gata}/{pr.total}
                    </span>
                  </div>
                </td>
                <td className={`px-3.5 py-2.5 num text-[12.5px] ${trecut ? "text-red-t" : "text-ink-2"}`}>{p.termen ? termenScurt(p.termen) : "—"}</td>
                <td className="px-3.5 py-2.5 text-ink-2">{lucreaza(p.id)}</td>
                <td className="px-3.5 py-2.5 num text-[12.5px] text-ink-3">{ziScurta(p.clienti.creat_la)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Callerul și closerul: clienții făcuți din lead-urile lor, cu link la fișa de lead (ca în etapa 1). */
async function ClientiiMei() {
  const db = await supabase();
  const [{ data: clienti }, { data: oameni }] = await Promise.all([
    db.from("clienti").select("id, lead_id, nume, telefon, email, serviciu, sursa, caller_id, closer_id, creat_la").order("creat_la", { ascending: false }),
    db.from("profiluri").select("id, nume"),
  ]);
  if (!clienti?.length) return gol("Încă n-ai clienți. Apar aici lead-urile tale marcate „Client”.");

  const numeOm = new Map((oameni ?? []).map((o) => [o.id, o.nume]));
  const nume = (id: string | null) => (id ? numeOm.get(id) ?? "—" : "—");
  const acum = new Date();

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line text-left">
            {["Nume", "Serviciu", "Sursă", "Caller", "Closer", "Client din"].map((t) => (
              <th key={t} className="lbl px-3.5 py-2.5 font-semibold">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clienti.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0">
              <td className="px-3.5 py-2.5">
                {c.lead_id ? (
                  <Link href={`/lead-uri/${c.lead_id}`} className="font-medium hover:text-amber">{c.nume}</Link>
                ) : (
                  <span className="font-medium">{c.nume}</span>
                )}
                <span className="block num text-[12px] text-ink-3">{c.telefon ?? c.email}</span>
              </td>
              <td className="px-3.5 py-2.5 text-ink-2">{ETICHETE.serviciu[c.serviciu]}</td>
              <td className="px-3.5 py-2.5 text-ink-2">{ETICHETE.sursa[c.sursa]}</td>
              <td className="px-3.5 py-2.5 text-ink-2">{nume(c.caller_id)}</td>
              <td className="px-3.5 py-2.5 text-ink-2">{nume(c.closer_id)}</td>
              <td className="px-3.5 py-2.5 num text-[12.5px] text-ink-3">{cand(c.creat_la, acum)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
