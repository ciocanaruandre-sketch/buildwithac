"use client";

import { useState } from "react";
import { unesteReclame } from "@/app/(app)/reclame/actiuni";
import { useActiune } from "@/components/finante/useActiune";

export type AltaReclama = { id: string; nume: string; campanie: string };

/**
 * „Unește cu…”: o reclamă redenumită în Meta apare ca două. Cea aleasă aici intră în reclama de pe card,
 * cu lead-urile și suma cheltuită; lead-urile care vin mai târziu cu numele ei ajung tot aici.
 */
export function UnesteCu({ id, nume, alte, inchide }: { id: string; nume: string; alte: AltaReclama[]; inchide: () => void }) {
  const [aleasa, setAleasa] = useState("");
  const { mesaj, lucreaza, fa } = useActiune();

  if (!alte.length) {
    return (
      <div className="flex flex-col gap-2 pt-2">
        <p className="text-[13px] text-ink-3">Nu mai e altă reclamă pe aceeași platformă cu care s-o unești.</p>
        <button type="button" className="btn mic self-start" onClick={inchide}>
          Închide
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      <label className="flex flex-col gap-1">
        <span className="lbl">Reclama de unit cu asta</span>
        <select className="camp" value={aleasa} onChange={(e) => setAleasa(e.target.value)}>
          <option value="">Alege reclama…</option>
          {alte.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nume}
              {a.campanie ? ` · ${a.campanie}` : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[12.5px] text-ink-3">
        Lead-urile și suma ei trec la „{nume}”. Lead-urile care vin cu numele ei ajung tot aici.
      </p>
      {mesaj && (
        <p role="alert" className="text-[13px] text-red-t">
          {mesaj}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn pri mic" disabled={!aleasa || lucreaza} onClick={() => fa(() => unesteReclame(id, aleasa), inchide)}>
          Unește
        </button>
        <button type="button" className="btn mic" disabled={lucreaza} onClick={inchide}>
          Renunță
        </button>
      </div>
    </div>
  );
}
