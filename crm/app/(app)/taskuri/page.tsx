import { BaraSus } from "@/components/BaraSus";
import Link from "next/link";
import { BifaTask } from "@/components/fisa/Taskuri";
import { termenScurt } from "@/lib/afisare";
import { cerRol } from "@/lib/eu";
import { grupeazaTaskuri } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { ziuaRomaniei } from "@/lib/timp";

/** „Task-urile mele”: ce am de făcut, de la toți clienții. Pentru Admin și Constructor. */
export default async function TaskurileMele() {
  const om = await cerRol("admin", "constructor");
  const db = await supabase();
  const { data } = await db
    .from("taskuri")
    .select("id, titlu, om_id, termen, gata, gata_la, creat_la, proiect_id, proiecte (titlu, client_id, clienti (nume))")
    .eq("om_id", om.id)
    .eq("gata", false);
  const g = grupeazaTaskuri(data ?? [], ziuaRomaniei(new Date()));
  const grupe = [
    { titlu: "Întârziate", taskuri: g.intarziate, rosu: true },
    { titlu: "Azi", taskuri: g.azi, rosu: false },
    { titlu: "Urmează", taskuri: g.urmeaza, rosu: false },
    { titlu: "Fără termen", taskuri: g.faraTermen, rosu: false },
  ].filter((x) => x.taskuri.length);

  return (
    <>
      <BaraSus cale={[{ eticheta: "Task-urile mele" }]} />
      <h1 className="mb-4 text-[26px] leading-tight sm:text-[30px]">Task-urile mele</h1>

      {grupe.length === 0 ? (
        <p className="panel px-4 py-6 text-[14px] text-ink-2">Niciun task pe numele tău.</p>
      ) : (
        <div className="flex max-w-[860px] flex-col gap-4">
          {grupe.map((grupa) => (
            <section key={grupa.titlu} aria-label={grupa.titlu} className="panel p-3.5">
              <h2 className={`lbl mb-2 ${grupa.rosu ? "!text-red-t" : ""}`}>
                {grupa.titlu} <span className="num ml-1 font-normal">{grupa.taskuri.length}</span>
              </h2>
              <ul className="flex flex-col">
                {grupa.taskuri.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2 text-[13px] last:border-0">
                    <BifaTask id={t.id} titlu={t.titlu} gata={false} />
                    <span className="min-w-[160px] flex-1">{t.titlu}</span>
                    {t.termen && <span className={`num flex-none text-[12px] ${grupa.rosu ? "text-red-t" : "text-ink-3"}`}>{termenScurt(t.termen)}</span>}
                    <Link href={{ pathname: `/clienti/${t.proiecte.client_id}`, query: { proiect: t.proiect_id } }} className="min-w-0 max-w-full truncate text-[12px] text-ink-2 hover:text-amber">
                      {t.proiecte.clienti.nume} · {t.proiecte.titlu}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
