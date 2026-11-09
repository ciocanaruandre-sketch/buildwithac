import Link from "next/link";
import { cand } from "@/lib/afisare";
import { eu } from "@/lib/eu";
import { supabase } from "@/lib/supabase/server";
import { ETICHETE } from "@/lib/tipuri";

/** Etapa 1: doar lista. Fișa clientului (proiecte, bani) vine în etapa 2. Ce vede fiecare hotărăște RLS. */
export default async function Clienti() {
  const om = await eu();
  const titlu = (
    <div className="mb-4">
      <p className="lbl mb-1.5">CRM</p>
      <h1 className="text-[26px] font-bold">Clienți</h1>
    </div>
  );

  if (om.rol === "constructor") {
    return (
      <>
        {titlu}
        <p className="panel px-4 py-6 text-[14px] text-ink-2">Aici apar clienții la care lucrezi, după ce te pune Andrei pe un proiect.</p>
      </>
    );
  }

  const db = await supabase();
  const [{ data: clienti }, { data: oameni }] = await Promise.all([
    db.from("clienti").select("id, lead_id, nume, telefon, email, serviciu, sursa, caller_id, closer_id, creat_la").order("creat_la", { ascending: false }),
    db.from("profiluri").select("id, nume"),
  ]);
  const numeOm = new Map((oameni ?? []).map((o) => [o.id, o.nume]));
  const nume = (id: string | null) => (id ? numeOm.get(id) ?? "—" : "—");
  const acum = new Date();

  return (
    <>
      {titlu}
      {!clienti?.length ? (
        <p className="panel px-4 py-6 text-[14px] text-ink-2">
          {om.rol === "admin" ? "Încă niciun client. Apare aici când un closer marchează „Client” pe un lead." : "Încă n-ai clienți. Apar aici lead-urile tale marcate „Client”."}
        </p>
      ) : (
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
                    <span className="block font-mono text-[11px] text-ink-3">{c.telefon ?? c.email}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-2">{ETICHETE.serviciu[c.serviciu]}</td>
                  <td className="px-3.5 py-2.5 text-ink-2">{ETICHETE.sursa[c.sursa]}</td>
                  <td className="px-3.5 py-2.5 text-ink-2">{nume(c.caller_id)}</td>
                  <td className="px-3.5 py-2.5 text-ink-2">{nume(c.closer_id)}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[12px] text-ink-3">{cand(c.creat_la, acum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
