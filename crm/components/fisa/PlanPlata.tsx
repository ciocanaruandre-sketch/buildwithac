"use client";

import { useState } from "react";
import { facePlan, schimbaPlan, type PlanScris } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { useActiune } from "@/components/finante/useActiune";
import { termenScurt } from "@/lib/afisare";
import { planDePlata, type AlegerePlan } from "@/lib/finante";
import { citesteLei, citesteProcent, lei } from "@/lib/proiecte";
import { ziuaPeste, ziuaRomaniei } from "@/lib/timp";

const FELURI = [
  { cheie: "odata", eticheta: "Tot odată" },
  { cheie: "avans", eticheta: "Avans + rest" },
  { cheie: "rate", eticheta: "Rate" },
] as const;

/** Aceeași citire ca pe server, doar pentru previzualizare (serverul verifică din nou). */
function alegere(d: PlanScris, pret: number): AlegerePlan | null {
  if (d.fel === "odata") return d.zi ? { fel: "odata", zi: d.zi } : null;
  if (d.fel === "rate") {
    const nr = Number(d.nr);
    return Number.isInteger(nr) && nr >= 2 && nr <= 36 && d.zi ? { fel: "rate", nr, primaZi: d.zi } : null;
  }
  if (!d.zi || !d.ziRest) return null;
  if (d.avans.trim().endsWith("%")) {
    const p = citesteProcent(d.avans);
    return typeof p === "number" && p > 0 && p < 100 ? { fel: "avans", avans: { procent: p }, ziAvans: d.zi, ziRest: d.ziRest } : null;
  }
  const l = citesteLei(d.avans);
  return typeof l === "number" && l > 0 && l < pret ? { fel: "avans", avans: { lei: l }, ziAvans: d.zi, ziRest: d.ziRest } : null;
}

/** Planul de plată: tot odată, avans + rest sau rate. La „Schimbă planul”, acoperă doar ce n-a intrat încă (`pret`). */
export function PlanPlata({ proiectId, pret, schimba = false, laInchidere }: { proiectId: string; pret: number; schimba?: boolean; laInchidere?: () => void }) {
  const acum = new Date();
  const [d, setD] = useState<PlanScris>({ fel: "avans", zi: ziuaRomaniei(acum), ziRest: ziuaPeste(acum, 30), avans: "50%", nr: "3" });
  const { mesaj, lucreaza, fa } = useActiune();
  const a = alegere(d, pret);
  const previzualizare = a ? planDePlata(pret, a) : [];
  const camp = (eticheta: string, cheie: keyof PlanScris, tip = "text") => (
    <label className="flex min-w-[140px] flex-1 flex-col gap-1">
      <span className="lbl">{eticheta}</span>
      <input className="camp" type={tip} inputMode={tip === "text" ? "decimal" : undefined} value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div className="flex flex-col gap-3" data-testid="plan-plata">
      <p className="text-[13px] text-ink-2">
        {schimba ? "Planul nou acoperă ce n-a intrat încă" : "Prețul"}: <b className="num text-ink">{lei(pret)}</b>
      </p>
      <div role="group" aria-label="Felul plății" className="seg">
        {FELURI.map((f) => (
          <button key={f.cheie} type="button" aria-pressed={d.fel === f.cheie} onClick={() => setD({ ...d, fel: f.cheie })}>
            {f.eticheta}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {d.fel === "odata" && camp("Data plății", "zi", "date")}
        {d.fel === "avans" && (
          <>
            {camp("Avans (lei sau %)", "avans")}
            {camp("Data avansului", "zi", "date")}
            {camp("Data restului", "ziRest", "date")}
          </>
        )}
        {d.fel === "rate" && (
          <>
            {camp("Câte rate", "nr")}
            {camp("Prima rată", "zi", "date")}
          </>
        )}
      </div>
      {previzualizare.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-r border border-line px-3 py-2 text-[13px]">
          {previzualizare.map((t) => (
            <li key={t.eticheta} className="flex justify-between gap-3">
              <span className="text-ink-2">
                {t.eticheta} · {termenScurt(t.scadenta)}
              </span>
              <b className="num font-semibold">{lei(t.suma_lei)}</b>
            </li>
          ))}
        </ul>
      )}
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(() => (schimba ? schimbaPlan(proiectId, d) : facePlan(proiectId, d)), laInchidere)}>
          Salvează planul
        </button>
        {laInchidere && (
          <button type="button" className="btn" disabled={lucreaza} onClick={laInchidere}>
            Renunță
          </button>
        )}
      </div>
    </div>
  );
}

/** „Schimbă planul de plată”: butonul care deschide formularul. */
export function SchimbaPlan({ proiectId, ramas }: { proiectId: string; ramas: number }) {
  const [deschis, setDeschis] = useState(false);
  if (!deschis)
    return (
      <button type="button" className="btn mic" onClick={() => setDeschis(true)}>
        Schimbă planul de plată
      </button>
    );
  return (
    <div className="w-full rounded-r border border-line p-3">
      <PlanPlata proiectId={proiectId} pret={ramas} schimba laInchidere={() => setDeschis(false)} />
    </div>
  );
}
