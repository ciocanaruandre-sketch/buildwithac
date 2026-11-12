"use client";

import { useState } from "react";
import { adaugaOm } from "@/app/(app)/clienti/[id]/actiuni";
import { puneVanzator, scoateVanzator } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { useActiune } from "@/components/finante/useActiune";

type OmProcent = { id: string; nume: string; rol: string; procent: number | null };
const procentText = (p: number | null) => (p === null ? "" : String(p).replace(".", ","));

function Rand({ proiectId, om, constructor }: { proiectId: string; om: OmProcent; constructor: boolean }) {
  const [v, setV] = useState(procentText(om.procent));
  const { mesaj, lucreaza, fa } = useActiune();
  const salveaza = () => fa(() => (constructor ? adaugaOm(proiectId, om.id, v) : puneVanzator(proiectId, om.id, v)));
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="min-w-0 flex-1 truncate">
          {om.nume} <span className="text-ink-3">· {om.rol}</span>
        </span>
        <input
          className="camp !w-[64px] !px-2 !py-1 text-right text-[12.5px]"
          aria-label={`Procentul lui ${om.nume}`}
          placeholder="—"
          inputMode="decimal"
          value={v}
          disabled={lucreaza}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== procentText(om.procent) && salveaza()}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
        <span className="text-ink-3">%</span>
        {!constructor && (
          <button type="button" className="text-[12px] text-ink-3 hover:text-ink" disabled={lucreaza} onClick={() => fa(() => scoateVanzator(proiectId, om.id))} aria-label={`Scoate-l pe ${om.nume} de pe listă`}>
            ×
          </button>
        )}
      </div>
      {mesaj && <span role="alert" className="text-[12px] text-red-t">{mesaj}</span>}
    </div>
  );
}

/**
 * Doar pentru Admin: cine primește comision din încasările proiectului și cu ce procent.
 * Constructorii vin din „Lucrează”; callerul și closerul se adaugă și se scot de aici (nu le dă acces la fișă).
 */
export function OameniProcente({
  proiectId,
  constructori,
  vanzatori,
  deAdaugat,
}: {
  proiectId: string;
  constructori: OmProcent[];
  vanzatori: OmProcent[];
  deAdaugat: (OmProcent & { procentBaza: number | null })[];
}) {
  const [om, setOm] = useState("");
  const [procent, setProcent] = useState("");
  const { mesaj, lucreaza, fa } = useActiune();
  return (
    <div className="panel px-4 py-3.5" data-testid="oameni-procente">
      <p className="lbl">Oameni și procente</p>
      <div className="mt-2 flex flex-col gap-2">
        {constructori.length + vanzatori.length === 0 && <span className="text-[13px] text-ink-3">Nimeni nu primește comision. Banii sunt doar ai tăi.</span>}
        {constructori.map((o) => (
          <Rand key={o.id} proiectId={proiectId} om={o} constructor />
        ))}
        {vanzatori.map((o) => (
          <Rand key={o.id} proiectId={proiectId} om={o} constructor={false} />
        ))}
      </div>
      {deAdaugat.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <select
            className="camp !w-auto !py-1 text-[12px]"
            aria-label="Adaugă un caller sau closer"
            value={om}
            onChange={(e) => {
              setOm(e.target.value);
              setProcent(procentText(deAdaugat.find((x) => x.id === e.target.value)?.procentBaza ?? null));
            }}
          >
            <option value="">Adaugă un caller sau closer…</option>
            {deAdaugat.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nume} · {o.rol}
              </option>
            ))}
          </select>
          <input className="camp !w-[58px] !px-2 !py-1 text-[12px]" aria-label="Procentul lui" placeholder="%" inputMode="decimal" value={procent} onChange={(e) => setProcent(e.target.value)} />
          <button
            type="button"
            className="btn mic"
            disabled={lucreaza || !om}
            onClick={() =>
              fa(
                () => puneVanzator(proiectId, om, procent),
                () => {
                  setOm("");
                  setProcent("");
                },
              )
            }
          >
            Adaugă
          </button>
        </div>
      )}
      {mesaj && <p role="alert" className="mt-1 text-[12px] text-red-t">{mesaj}</p>}
      <p className="mt-2 text-[11.5px] text-ink-3">Procentul nou contează de la următoarea încasare.</p>
    </div>
  );
}
