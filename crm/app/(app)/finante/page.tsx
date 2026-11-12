import { BaraSus } from "@/components/BaraSus";
import { DePlatitEchipei, type OmDePlatit } from "@/components/finante/DePlatitEchipei";
import { Incasari, type TransaCuClient } from "@/components/finante/Incasari";
import { ProcenteBaza } from "@/components/finante/ProcenteBaza";
import { Taburi } from "@/components/Taburi";
import { eu } from "@/lib/eu";
import type { Transa } from "@/lib/finante";
import { supabase } from "@/lib/supabase/server";
import { ziuaRomaniei } from "@/lib/timp";
import { ETICHETE } from "@/lib/tipuri";

const ZI_TITLU = new Intl.DateTimeFormat("ro-RO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/** „Vineri, 13 noiembrie”. */
const ziTitlu = (zi: string) => {
  const s = ZI_TITLU.format(new Date(`${zi}T00:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Prima zi a lunii de după `zi` (YYYY-MM-DD). */
const lunaUrmatoare = (zi: string) => {
  const [a, l] = zi.split("-").map(Number);
  return l === 12 ? `${a + 1}-01-01` : `${a}-${String(l + 1).padStart(2, "0")}-01`;
};

export default async function Finante() {
  const om = await eu();
  const azi = ziuaRomaniei(new Date());
  const antet = (
    <>
      <BaraSus cale={[{ eticheta: "Finanțe" }]} />
      <h1 className="text-[26px] leading-tight sm:text-[30px]">Finanțe</h1>
    </>
  );
  if (om.rol !== "admin") {
    return (
      <>
        {antet}
        <p className="mt-1 mb-4 text-[13.5px] text-ink-3">Comisioanele tale, din banii încasați de la clienți.</p>
      </>
    );
  }

  const db = await supabase();
  const inceputLuna = `${azi.slice(0, 7)}-01`;
  const [{ data: transeDb }, { data: comisioaneDb }, { data: oameniDb }, { data: procente }] = await Promise.all([
    // neîncasatele, plus ce s-a încasat sau e programat luna asta (pentru cifre)
    db
      .from("transe")
      .select("*, proiecte (client_id, clienti (nume))")
      .or(`incasata_la.is.null,incasata_la.gte.${inceputLuna},and(scadenta.gte.${inceputLuna},scadenta.lt.${lunaUrmatoare(azi)})`),
    db.from("comisioane").select("id, tip, procent, suma_lei, platit_la, om_id, proiect_id, creat_la, transe (eticheta), proiecte (client_id, clienti (nume))").is("platit_la", null).order("creat_la"),
    db.from("profiluri").select("id, nume, rol"),
    db.from("procente_baza").select("categorie, rol, procent"),
  ]);

  const transe: TransaCuClient[] = (transeDb ?? []).map(({ proiecte, ...t }) => ({
    ...(t as Transa),
    clientId: proiecte?.client_id ?? "",
    client: proiecte?.clienti?.nume ?? "client șters",
  }));

  const oameni: OmDePlatit[] = (oameniDb ?? [])
    .map((o) => ({
      id: o.id,
      nume: o.nume,
      rol: ETICHETE.rol[o.rol].toLowerCase(),
      randuri: (comisioaneDb ?? [])
        .filter((k) => k.om_id === o.id)
        .map((k) => ({
          id: k.id,
          tip: k.tip,
          procent: k.procent,
          suma_lei: k.suma_lei,
          platit_la: k.platit_la,
          eticheta: k.transe?.eticheta ?? "tranșă ștearsă",
          client: k.proiecte?.clienti && k.proiect_id ? { id: k.proiecte.client_id, nume: k.proiecte.clienti.nume, proiectId: k.proiect_id } : null,
        })),
    }))
    .filter((o) => o.randuri.length)
    .sort((a, b) => a.nume.localeCompare(b.nume, "ro"));

  return (
    <>
      {antet}
      <p className="mt-1 mb-4 text-[13.5px] text-ink-3">{ziTitlu(azi)}</p>
      <Taburi
        faraPanou
        taburi={[
          { cheie: "incasari", eticheta: "Încasări", continut: <Incasari transe={transe} azi={azi} /> },
          { cheie: "echipa", eticheta: "De plătit echipei", numar: oameni.length, continut: <DePlatitEchipei oameni={oameni} /> },
          { cheie: "procente", eticheta: "Procente de bază", continut: <ProcenteBaza procente={procente ?? []} /> },
        ]}
      />
    </>
  );
}
