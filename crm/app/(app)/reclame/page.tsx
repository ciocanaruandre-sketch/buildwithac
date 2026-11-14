import { notFound } from "next/navigation";
import { BaraSus } from "@/components/BaraSus";
import { AdaugaReclama } from "@/components/reclame/AdaugaReclama";
import { CardReclama } from "@/components/reclame/CardReclama";
import { TextAdsManager } from "@/components/reclame/TextAdsManager";
import { leadUri } from "@/lib/afisare";
import { eu } from "@/lib/eu";
import { lei } from "@/lib/proiecte";
import { ordoneaza, reclamaDinUtm, totaluri, type CifreReclama } from "@/lib/reclame";
import { supabase } from "@/lib/supabase/server";

function Total({ eticheta, valoare, sub, verde = false }: { eticheta: string; valoare: string; sub: string; verde?: boolean }) {
  return (
    <div className="panel px-3.5 py-3">
      <small className="text-[12px] text-ink-3">{eticheta}</small>
      <b className={`num mt-0.5 block text-[17px] font-semibold tracking-[-.02em] md:text-[21px] ${verde ? "text-green" : ""}`}>{valoare}</b>
      <small className="num text-[12px] text-ink-3">{sub}</small>
    </div>
  );
}

/** Doar Adminul: ce reclamă aduce clienți și bani (macheta B, „carduri cu pâlnie”). */
export default async function Reclame() {
  const om = await eu();
  if (om.rol !== "admin") notFound();

  const db = await supabase();
  const [{ data: cifre, error }, { data: dinReclame }] = await Promise.all([
    db.rpc("reclame_cifre"),
    // lead-urile cu sursa „Reclamă …” fără reclamă anume: puse de mână
    // sau venite dintr-un link de reclamă, dar cu legarea eșuată (o greșeală la intrare, scrisă în jurnal)
    db.from("lead_uri").select("id, reclame_lead_uri (id), cereri (utm)").in("sursa", ["reclama_meta", "reclama_tiktok"]),
  ]);

  if (error) {
    return (
      <>
        <BaraSus cale={[{ eticheta: "Reclame" }]} />
        <h1 className="mb-4 text-[26px] leading-tight sm:text-[30px]">Reclame</h1>
        <p role="alert" className="panel p-4 text-[14px] text-red-t">
          Nu s-au putut încărca reclamele. Reîncarcă pagina peste un minut.
        </p>
      </>
    );
  }

  const reclame = ordoneaza((cifre ?? []) as CifreReclama[]);
  const t = totaluri(reclame);
  const faraReclama = (dinReclame ?? []).filter((l) => !l.reclame_lead_uri);
  const nelegate = faraReclama.filter((l) => l.cereri.some((c) => reclamaDinUtm((c.utm ?? {}) as Record<string, string>))).length;
  const deMana = faraReclama.length - nelegate;
  const max = Math.max(1, ...reclame.map((r) => r.lead_uri));
  const pePlatforma = (p: string, faraId: string) =>
    reclame.filter((x) => x.platforma === p && x.id !== faraId).map((x) => ({ id: x.id, nume: x.nume, campanie: x.campanie }));

  return (
    <>
      <BaraSus cale={[{ eticheta: "Reclame" }]} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] leading-tight sm:text-[30px]">Reclame</h1>
          <p className="mt-1 text-[13.5px] text-ink-3">Ce reclamă îți aduce clienți și bani</p>
        </div>
        <AdaugaReclama />
      </div>

      {reclame.length === 0 ? (
        <>
          <p className="panel p-4 text-[14px] text-ink-2">
            Încă nicio reclamă. Lipește textul de mai jos o dată în Ads Manager: reclamele apar aici singure, la primul lead.
          </p>
          <TextAdsManager deschis />
        </>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Total eticheta="Cheltuit" valoare={lei(t.cheltuit)} sub={`${lei(t.peLead)} pe lead`} />
            <Total eticheta="Lead-uri" valoare={String(t.lead_uri)} sub={`din ${t.reclame} ${t.reclame === 1 ? "reclamă" : "reclame"}`} />
            <Total eticheta="Clienți" valoare={String(t.clienti)} sub={`${lei(t.peClient)} pe client`} />
            <Total eticheta="Încasat" valoare={lei(t.incasat)} sub={`+ ${lei(t.mai_vin)} mai vin`} verde />
          </div>
          {deMana > 0 && (
            <p className="mb-3 text-[13px] text-ink-3" data-testid="de-mana">
              {leadUri(deMana)} din reclame {deMana === 1 ? "adăugat" : "adăugate"} de mână, fără reclamă anume
            </p>
          )}
          {nelegate > 0 && (
            <p className="mb-3 text-[13px] text-amber" data-testid="nelegate">
              {leadUri(nelegate)} {nelegate === 1 ? "venit" : "venite"} din reclame nu {nelegate === 1 ? "s-a legat" : "s-au legat"} de
              reclama lor, deci nu intră în cifre. Reclama din link se vede pe fișa lead-ului.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {reclame.map((r) => (
              <CardReclama key={r.id} r={r} max={max} alte={pePlatforma(r.platforma, r.id)} />
            ))}
          </div>
          <TextAdsManager />
        </>
      )}
    </>
  );
}
