"use client";

import { useState } from "react";

/** Tab-urile unei fișe (lead sau client): un comutator segmentat, iar dedesubt panoul tab-ului ales. Conținutul vine gata randat de pe server. */
export function Taburi({ taburi }: { taburi: { cheie: string; eticheta: string; numar?: number; continut: React.ReactNode }[] }) {
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
        <div key={t.cheie} role="tabpanel" hidden={activ !== t.cheie} className="panel p-4">
          {t.continut}
        </div>
      ))}
    </div>
  );
}
