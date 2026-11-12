import { Ascuns } from "@/components/Ascuns";
import { BaraSus } from "@/components/BaraSus";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarSloturi } from "@/components/CalendarSloturi";
import { cerRol } from "@/lib/eu";
import { sloturiLibere, type ZiProgram } from "@/lib/sloturi";
import { supabase } from "@/lib/supabase/server";
import { FUS } from "@/lib/timp";

const ZILE = 14;
const ZI = new Intl.DateTimeFormat("ro-RO", { timeZone: FUS, weekday: "long", day: "numeric", month: "long" });
const ORA = new Intl.DateTimeFormat("ro-RO", { timeZone: FUS, hour: "2-digit", minute: "2-digit" });

export default async function Programeaza({ params, searchParams }: PageProps<"/lead-uri/[id]/programeaza">) {
  await cerRol("admin", "caller", "closer");
  const { id } = await params;
  const { closer } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await supabase();
  const acum = new Date();

  const [{ data: l }, { data: closeri }] = await Promise.all([
    db.from("lead_uri").select("id, nume").eq("id", id).maybeSingle(),
    db.from("profiluri").select("id, nume, rol, durata_discutie_min").eq("activ", true).in("rol", ["closer", "admin"]).order("nume"),
  ]);
  if (!l) notFound();
  const ales = (closeri ?? []).find((c) => c.id === closer);

  let zile: { zi: string; sloturi: { la: string; ora: string }[] }[] = [];
  if (ales) {
    const pana = new Date(acum.getTime() + (ZILE + 1) * 86_400_000).toISOString();
    const [{ data: program }, { data: ocupate }] = await Promise.all([
      db.from("program_closer").select("zi, de_la, pana_la").eq("closer_id", ales.id),
      db.from("discutii").select("incepe_la, sfarseste_la").eq("closer_id", ales.id).gt("sfarseste_la", acum.toISOString()).lt("incepe_la", pana),
    ]);
    const sloturi = sloturiLibere(
      (program ?? []) as ZiProgram[],
      ales.durata_discutie_min,
      (ocupate ?? []).map((o) => ({ de: new Date(o.incepe_la), pana: new Date(o.sfarseste_la) })),
      acum,
      ZILE,
    );
    const peZile = new Map<string, { la: string; ora: string }[]>();
    for (const s of sloturi) {
      const zi = ZI.format(s);
      peZile.set(zi, [...(peZile.get(zi) ?? []), { la: s.toISOString(), ora: ORA.format(s) }]);
    }
    zile = [...peZile].map(([zi, s]) => ({ zi, sloturi: s }));
  }

  return (
    <>
      <BaraSus cale={[{ eticheta: "Lead-uri", href: "/lead-uri" }, { eticheta: <Ascuns>{l.nume}</Ascuns>, href: `/lead-uri/${id}` }, { eticheta: "Programează" }]} />
      <h1 className="mb-5 text-[26px] leading-tight sm:text-[30px]">Programează discuția</h1>

      <p className="lbl mb-2">1. Closerul</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {(closeri ?? []).map((c) => (
          <Link key={c.id} href={`/lead-uri/${id}/programeaza?closer=${c.id}`} className={`btn ${c.id === ales?.id ? "pri" : ""}`}>
            {c.nume}
          </Link>
        ))}
      </div>

      {ales && (
        <>
          <p className="lbl mb-2">
            2. Ora · discuții de {ales.durata_discutie_min} de minute, ora României
          </p>
          <CalendarSloturi leadId={id} closerId={ales.id} zile={zile} />
        </>
      )}
    </>
  );
}
