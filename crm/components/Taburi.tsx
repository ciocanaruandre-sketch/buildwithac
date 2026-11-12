"use client";

import { useState } from "react";

/** Tab-urile unei fișe (lead sau client): un comutator segmentat, iar dedesubt panoul tab-ului ales. Conținutul vine gata randat de pe server. */
/** `faraPanou`: panourile stau fără chenar (pentru conținut care are deja chenarele lui, ca coloanele din Finanțe). */
export function Taburi({ taburi, faraPanou = false }: { taburi: { cheie: string; eticheta: string; numar?: number; continut: React.ReactNode }[]; faraPanou?: boolean }) {
  const [activ, setActiv] = useState(taburi[0]?.cheie);
  return (
    <div className="min-w-0">
      <div role="tablist" className="seg mb-3.5">
        {taburi.map((t) => (
          <button key={t.cheie} role="tab" type="button" aria-selected={activ === t.cheie} onClick={() => setActiv(t.cheie)}>
            {t.eticheta}
            {t.numar !== undefined && <span className="num text-[11.5px] text-ink-3">{t.numar}</span>}
          </button>
        ))}
      </div>
      {taburi.map((t) => (
        <div key={t.cheie} role="tabpanel" hidden={activ !== t.cheie} className={faraPanou ? "min-w-0" : "panel p-4"}>
          {t.continut}
        </div>
      ))}
    </div>
  );
}
