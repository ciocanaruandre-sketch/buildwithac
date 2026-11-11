"use client";

import { useState } from "react";

/** Tab-urile din dreapta unei fișe (lead sau client). Conținutul vine gata randat de pe server. */
export function Taburi({ taburi }: { taburi: { cheie: string; eticheta: string; numar?: number; continut: React.ReactNode }[] }) {
  const [activ, setActiv] = useState(taburi[0]?.cheie);
  return (
    <div className="panel">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-2">
        {taburi.map((t) => (
          <button
            key={t.cheie}
            role="tab"
            type="button"
            aria-selected={activ === t.cheie}
            onClick={() => setActiv(t.cheie)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-[13px] font-semibold ${activ === t.cheie ? "border-amber text-ink" : "border-transparent text-ink-3 hover:text-ink-2"}`}
          >
            {t.eticheta}
            {t.numar !== undefined && <span className="ml-1.5 font-mono text-[11px] font-normal text-ink-3">{t.numar}</span>}
          </button>
        ))}
      </div>
      {taburi.map((t) => (
        <div key={t.cheie} role="tabpanel" hidden={activ !== t.cheie} className="p-3.5">
          {t.continut}
        </div>
      ))}
    </div>
  );
}
