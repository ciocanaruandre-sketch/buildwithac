"use client";

import { useState } from "react";
import { adaugaNotitaProiect, stergeNotitaProiect } from "@/app/(app)/clienti/[id]/actiuni-fisa";
import { ButonSterge, Mesaj, useActiune } from "@/components/fisa/comune";

export type NotitaAfisata = { id: string; autor: string; cand: string; text: string };

/** Tab-ul „Notițe” al proiectului. Scrie oricine lucrează la el; „Șterge” are doar Adminul. */
export function Notite({ proiectId, notite, poateSterge }: { proiectId: string; notite: NotitaAfisata[]; poateSterge: boolean }) {
  const { fa, mesaj, lucreaza } = useActiune();
  const [text, setText] = useState("");

  return (
    <div data-testid="notite">
      <div className="mb-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="lbl">Notiță nouă</span>
          <textarea className="camp min-h-20" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div>
          <button type="button" className="btn pri" disabled={lucreaza || !text.trim()} onClick={() => fa(() => adaugaNotitaProiect(proiectId, text), () => setText(""))}>
            Adaugă notița
          </button>
        </div>
        <Mesaj text={mesaj} />
      </div>

      {notite.length === 0 && <p className="text-[13px] text-ink-3">Nicio notiță încă.</p>}
      {notite.map((n) => (
        <div key={n.id} className="mb-2 flex items-start gap-3 border-l-2 border-line-2 bg-[#18181c] px-3 py-2.5 text-[13px]">
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-mono text-[11px] text-ink-3">
              <span>{n.autor}</span> · {n.cand}
            </p>
            <p className="whitespace-pre-wrap">{n.text}</p>
          </div>
          {poateSterge && <ButonSterge oprit={lucreaza} sterge={() => fa(() => stergeNotitaProiect(n.id))} />}
        </div>
      ))}
    </div>
  );
}
