"use client";

import { useState } from "react";
import { incaseaza } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { useActiune } from "@/components/finante/useActiune";
import { citesteLei, lei } from "@/lib/proiecte";
import { ziuaRomaniei } from "@/lib/timp";

/**
 * „Am încasat”: deschide suma (tranșa întreagă) și data (azi), amândouă de schimbat.
 * O sumă mai mare decât tranșa cere o confirmare. Același buton pe fișa clientului și pe pagina Finanțe.
 */
export function Incaseaza({ transaId, suma, auriu = false, eticheta = "Am încasat" }: { transaId: string; suma: number; auriu?: boolean; eticheta?: string }) {
  const [deschis, setDeschis] = useState(false);
  const [d, setD] = useState({ suma: String(suma), zi: "" });
  const [confirma, setConfirma] = useState(false);
  const { mesaj, setMesaj, lucreaza, fa } = useActiune();

  if (!deschis) {
    return (
      <button
        type="button"
        className={`btn mic ${auriu ? "pri" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setD({ suma: String(suma), zi: ziuaRomaniei(new Date()) });
          setDeschis(true);
        }}
      >
        {eticheta}
      </button>
    );
  }

  const scris = citesteLei(d.suma);
  const trimite = (peste: boolean) => fa(() => incaseaza(transaId, { ...d, peste }), () => setDeschis(false));

  return (
    <div className="flex w-full flex-col gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-[130px] flex-1 flex-col gap-1">
          <span className="lbl">Suma încasată (lei)</span>
          <input
            className="camp"
            inputMode="numeric"
            value={d.suma}
            onChange={(e) => {
              setD({ ...d, suma: e.target.value });
              setConfirma(false);
            }}
          />
        </label>
        <label className="flex min-w-[150px] flex-1 flex-col gap-1">
          <span className="lbl">Data încasării</span>
          <input className="camp" type="date" value={d.zi} max={ziuaRomaniei(new Date())} onChange={(e) => setD({ ...d, zi: e.target.value })} />
        </label>
      </div>
      {typeof scris === "number" && scris > 0 && scris < suma && (
        <p className="text-[12.5px] text-ink-3">Restul de {lei(suma - scris)} rămâne de încasat, cu aceeași dată.</p>
      )}
      {confirma && typeof scris === "number" && (
        <p className="text-[13px] text-amber">Suma e mai mare decât tranșa. Încasez {lei(scris)}?</p>
      )}
      {mesaj && <p role="alert" className="text-[13px] text-red-t">{mesaj}</p>}
      <div className="flex flex-wrap gap-2">
        {confirma && typeof scris === "number" ? (
          <button type="button" className="btn pri mic" disabled={lucreaza} onClick={() => trimite(true)}>
            Da, încasez {lei(scris)}
          </button>
        ) : (
          <button
            type="button"
            className="btn pri mic"
            disabled={lucreaza}
            onClick={() => {
              if (typeof scris === "number" && scris > suma) {
                setMesaj(null);
                return setConfirma(true);
              }
              trimite(false);
            }}
          >
            Încasează
          </button>
        )}
        <button
          type="button"
          className="btn mic"
          disabled={lucreaza}
          onClick={() => {
            setDeschis(false);
            setConfirma(false);
            setMesaj(null);
          }}
        >
          Renunță
        </button>
      </div>
    </div>
  );
}
