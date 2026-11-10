"use client";

import { useState } from "react";
import { adaugaLink, stergeMaterial } from "@/app/(app)/clienti/[id]/actiuni-fisa";
import { ButonSterge, Mesaj, useActiune } from "@/components/fisa/comune";

export type MaterialAfisat = { id: string; titlu: string; nota: string | null; eticheta: string; href: string; cine: string; cand: string; marime: string | null };

const GOL = { titlu: "", url: "", nota: "" };

/** Tab-ul „Materiale”: link-urile (Drive, Figma, răspunsurile din formular) și fișierele proiectului. */
export function Materiale({ proiectId, materiale }: { proiectId: string; materiale: MaterialAfisat[] }) {
  const { fa, mesaj, lucreaza } = useActiune();
  const [d, setD] = useState(GOL);

  const camp = (eticheta: string, cheie: keyof typeof GOL, loc?: string) => (
    <label className="flex min-w-[180px] flex-1 flex-col gap-1">
      <span className="lbl">{eticheta}</span>
      <input className="camp" placeholder={loc} value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div data-testid="materiale">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        {camp("Titlu", "titlu")}
        {camp("Link", "url", "https://…")}
        {camp("Notă (opțional)", "nota")}
        <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(() => adaugaLink(proiectId, d), () => setD(GOL))}>
          Adaugă link-ul
        </button>
      </div>
      <div className="mb-3">
        <Mesaj text={mesaj} />
      </div>

      {materiale.length === 0 ? (
        <p className="text-[13px] text-ink-3">Niciun material încă. Pune aici link-urile de Drive sau Figma și răspunsurile din formular.</p>
      ) : (
        <ul className="flex flex-col">
          {materiale.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-line py-2.5 text-[13px] last:border-0">
              <span className="grid h-7 w-9 flex-none place-items-center rounded-r border border-line-2 font-label text-[9.5px] font-semibold tracking-wider text-ink-3">{m.eticheta}</span>
              <div className="min-w-0 flex-1">
                <span className="font-medium break-words">{m.titlu}</span>
                {m.nota && <p className="text-[12px] text-ink-3">{m.nota}</p>}
              </div>
              {m.marime && <span className="flex-none font-mono text-[11px] text-ink-3">{m.marime}</span>}
              <span className="flex-none text-[12px] text-ink-3">
                {m.cine} · {m.cand}
              </span>
              <a href={m.href} target="_blank" rel="noreferrer" className="flex-none text-amber">
                deschide
              </a>
              <ButonSterge oprit={lucreaza} sterge={() => fa(() => stergeMaterial(m.id))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
