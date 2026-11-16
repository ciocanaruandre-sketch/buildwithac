import { BaraSus } from "@/components/BaraSus";
import Link from "next/link";
import { CardGoogle, type StareGoogle } from "@/components/calendar/CardGoogle";
import { FormularProgram } from "@/components/FormularProgram";
import { cerRol } from "@/lib/eu";
import type { ZiProgram } from "@/lib/sloturi";
import { supabase } from "@/lib/supabase/server";

export default async function Program({ searchParams }: PageProps<"/program">) {
  const om = await cerRol("admin", "closer");
  const { closer, google } = await searchParams;
  const db = await supabase();
  const { data: closeri } = await db.from("profiluri").select("id, nume, durata_discutie_min").eq("activ", true).in("rol", ["closer", "admin"]).order("nume");
  // closerul își vede doar programul lui; Adminul alege
  const id = om.rol === "admin" && typeof closer === "string" && closeri?.some((c) => c.id === closer) ? closer : om.id;
  const ales = closeri?.find((c) => c.id === id);
  const [{ data: program }, { data: stari }] = await Promise.all([
    db.from("program_closer").select("zi, de_la, pana_la").eq("closer_id", id),
    // fără cheile Google, cardul nu apare și CRM-ul merge ca înainte
    process.env.GOOGLE_CLIENT_ID ? db.rpc("calendar_stari") : Promise.resolve({ data: null }),
  ]);
  const g = stari?.find((s) => s.om_id === id);
  const stareGoogle: StareGoogle = !g?.conectat ? "neconectat" : g.stare === "cazut" ? "cazut" : "ok";
  const mesaj = google === "ok" || google === "anulat" || google === "eroare" || google === "fara_drepturi" ? google : null;

  return (
    <>
      <BaraSus cale={[{ eticheta: "Program" }]} />
      <h1 className="mb-2 text-[26px] leading-tight sm:text-[30px]">{id === om.id ? "Programul meu" : `Programul lui ${ales?.nume}`}</h1>
      <p className="mb-4 max-w-xl text-[13px] text-ink-2">Zilele și orele în care poți ține discuții. Callerii văd doar orele libere din intervalele astea, ora României.</p>
      {om.rol === "admin" && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(closeri ?? []).map((c) => (
            <Link key={c.id} href={`/program?closer=${c.id}`} className={`btn ${c.id === id ? "pri" : ""}`}>
              {c.nume}
            </Link>
          ))}
        </div>
      )}
      {stari && (
        <CardGoogle stare={stareGoogle} email={g?.email ?? null} alCuiNume={id === om.id ? null : (ales?.nume ?? "")} mesaj={id === om.id ? mesaj : null} />
      )}
      <FormularProgram key={id} closerId={id} program={(program ?? []) as ZiProgram[]} durata={ales?.durata_discutie_min ?? 30} />
    </>
  );
}
