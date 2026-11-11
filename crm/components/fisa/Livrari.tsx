"use client";

import { useState } from "react";
import { adaugaLivrare, schimbaStareLivrare, stergeLivrare } from "@/app/(app)/clienti/[id]/actiuni-fisa";
import { ButonSterge, Mesaj, useActiune } from "@/components/fisa/comune";
import { ETICHETE, STARI_LIVRARE, type StareLivrare } from "@/lib/tipuri";

export type LivrareAfisata = { id: string; titlu: string; link: string | null; nota: string | null; stare: StareLivrare; cand: string };

const CULOARE: Record<StareLivrare, string> = { trimis: "amber", aprobat: "green", de_refacut: "red" };
const GOL = { titlu: "", link: "", nota: "" };

/** Tab-ul „Livrat”: ce i s-a trimis clientului și ce a zis. */
export function Livrari({ proiectId, livrari }: { proiectId: string; livrari: LivrareAfisata[] }) {
  const { fa, mesaj, lucreaza } = useActiune();
  const [d, setD] = useState(GOL);

  const camp = (eticheta: string, cheie: keyof typeof GOL, lat = false) => (
    <label className={`flex flex-col gap-1 ${lat ? "min-w-[220px] flex-1" : "min-w-[180px] flex-1"}`}>
      <span className="lbl">{eticheta}</span>
      <input className="camp" value={d[cheie]} onChange={(e) => setD({ ...d, [cheie]: e.target.value })} />
    </label>
  );

  return (
    <div data-testid="livrari">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        {camp("Ce i-ai trimis", "titlu", true)}
        {camp("Link (opțional)", "link")}
        {camp("Notă (opțional)", "nota")}
        <button type="button" className="btn pri" disabled={lucreaza} onClick={() => fa(() => adaugaLivrare(proiectId, d), () => setD(GOL))}>
          Adaugă
        </button>
      </div>
      <div className="mb-3">
        <Mesaj text={mesaj} />
      </div>

      {livrari.length === 0 ? (
        <p className="text-[13px] text-ink-3">Încă nu i-ai trimis nimic clientului.</p>
      ) : (
        <ul className="flex flex-col">
          {livrari.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2.5 text-[13px] last:border-0">
              <div className="min-w-[160px] flex-1">
                {l.link ? (
                  <a href={l.link} target="_blank" rel="noreferrer" className="font-medium hover:text-amber">
                    {l.titlu}
                  </a>
                ) : (
                  <span className="font-medium">{l.titlu}</span>
                )}
                {l.nota && <p className="text-[12px] text-ink-3">{l.nota}</p>}
              </div>
              <span className="flex-none num text-[12px] text-ink-3">{l.cand}</span>
              <span data-testid="stare-livrare" className={`chip flex-none ${CULOARE[l.stare]}`}>{ETICHETE.livrare[l.stare]}</span>
              <select
                className="camp !w-auto flex-none !py-1 text-[12px]"
                aria-label="Starea livrării"
                value={l.stare}
                disabled={lucreaza}
                onChange={(e) => {
                  const stare = e.target.value as StareLivrare;
                  fa(() => schimbaStareLivrare(l.id, stare));
                }}
              >
                {STARI_LIVRARE.map((s) => (
                  <option key={s} value={s}>{ETICHETE.livrare[s]}</option>
                ))}
              </select>
              <ButonSterge oprit={lucreaza} sterge={() => fa(() => stergeLivrare(l.id))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
