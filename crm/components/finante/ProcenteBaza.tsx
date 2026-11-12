"use client";

import { useState } from "react";
import { schimbaProcentBaza } from "@/app/(app)/finante/actiuni";
import { ETICHETE, type Rol } from "@/lib/tipuri";

export type ProcentBaza = { categorie: string; rol: string; procent: number | null };

const RANDURI: { categorie: string; eticheta: string; nota?: string }[] = [
  { categorie: "site", eticheta: "Site" },
  { categorie: "automatizari", eticheta: "Automatizări" },
  { categorie: "1la1", eticheta: "1 la 1" },
  { categorie: "altceva", eticheta: "Altceva" },
  { categorie: "mentenanta", eticheta: "Mentenanță", nota: "(lunar)" },
];
const COLOANE: Rol[] = ["constructor", "closer", "caller"];

const scrie = (p: number | null | undefined) => (p === null || p === undefined ? "" : String(p).replace(".", ","));

function Celula({ categorie, rol, eticheta, procent, laSalvare }: { categorie: string; rol: Rol; eticheta: string; procent: number | null; laSalvare: (m: string | null, ok: boolean) => void }) {
  const [v, setV] = useState(scrie(procent));
  const [salvat, setSalvat] = useState(scrie(procent));
  return (
    <span className="inline-flex items-center gap-1">
      <input
        aria-label={`${eticheta}, ${ETICHETE.rol[rol]}`}
        className="camp num w-[64px] text-right"
        inputMode="decimal"
        placeholder="–"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={async () => {
          if (v.trim() === salvat) return;
          const r = await schimbaProcentBaza(categorie, rol, v);
          if (r.ok) setSalvat(v.trim());
          laSalvare(r.ok ? null : r.mesaj, r.ok);
        }}
      />
      <span className="text-[12px] text-ink-3">%</span>
    </span>
  );
}

/** Tab-ul „Procente de bază”: serviciu × rol, fiecare câmp se salvează când ieși din el. Gol = nestabilit. */
export function ProcenteBaza({ procente }: { procente: ProcentBaza[] }) {
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [salvat, setSalvat] = useState(false);
  const laSalvare = (m: string | null, ok: boolean) => {
    setMesaj(m);
    setSalvat(ok);
  };
  const gaseste = (c: string, r: Rol) => procente.find((p) => p.categorie === c && p.rol === r)?.procent ?? null;
  return (
    <>
      <p className="mb-3 text-[13px] text-ink-3">Se pun singure pe fiecare proiect nou. Pe un proiect anume le schimbi din fișa clientului.</p>
      <div className="panel max-w-[660px] overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="lbl px-3.5 py-2.5 font-semibold">Serviciu</th>
              {COLOANE.map((r) => (
                <th key={r} className="lbl px-2 py-2.5 text-right font-semibold">{ETICHETE.rol[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RANDURI.map((r) => (
              <tr key={r.categorie} className="border-b border-line last:border-0">
                <td className="px-3.5 py-2">
                  {r.eticheta} {r.nota && <span className="text-[12px] text-ink-3">{r.nota}</span>}
                </td>
                {COLOANE.map((rol) => (
                  <td key={rol} className="px-2 py-2 text-right">
                    <Celula categorie={r.categorie} rol={rol} eticheta={r.eticheta} procent={gaseste(r.categorie, rol)} laSalvare={laSalvare} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-[12.5px] text-ink-3">Gol = nestabilit: pe proiect apare „procent nestabilit” până îl scrii.</p>
      {mesaj && <p role="alert" className="mt-1.5 text-[13px] text-red-t">{mesaj}</p>}
      {!mesaj && salvat && (
        <p data-testid="procente-salvat" className="mt-1.5 text-[13px] text-green">
          Salvat.
        </p>
      )}
    </>
  );
}
