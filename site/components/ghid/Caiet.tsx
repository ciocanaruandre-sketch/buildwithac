"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { GhidCard } from "@/lib/ghiduri";
import { citesteProgres, scrieProgres } from "@/lib/progres";
import { CercProgres } from "./CercProgres";

type Progres = { bifate: string[]; comuta: (id: string) => void };
const ProgresCtx = createContext<Progres>({ bifate: [], comuta: () => {} });
export const useProgres = () => useContext(ProgresCtx);

/** Pagina ghidului în stilul „pași în caiet”: antetul, foile (children = MDX) și ce vine după ele. */
export function Caiet({ ghid, actualizat, children, dupa }: { ghid: GhidCard; actualizat: string; children: React.ReactNode; dupa: React.ReactNode }) {
  const [bifate, setBifate] = useState<string[]>([]);
  // bifele salvate se citesc după hidratare (pe server nu există localStorage)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setBifate(citesteProgres(ghid.slug)), [ghid.slug]);

  const comuta = useCallback((id: string) => {
    const bifat = bifate.includes(id);
    const noi = bifat ? bifate.filter((x) => x !== id) : [...bifate, id];
    setBifate(noi);
    scrieProgres(ghid.slug, noi);
    if (bifat) return;
    // după bifare, du-l la următorul pas nebifat
    const i = ghid.pasi.findIndex((p) => p.id === id);
    const urmator = ghid.pasi.slice(i + 1).find((p) => !noi.includes(p.id));
    if (!urmator) return;
    const lin = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => document.getElementById(urmator.id)?.scrollIntoView({ behavior: lin ? "auto" : "smooth", block: "start" }), 650);
  }, [bifate, ghid.slug, ghid.pasi]);

  // bara lipită apare după primul ecran
  const [bara, setBara] = useState(false);
  useEffect(() => {
    const f = () => setBara(scrollY > innerHeight * 0.7);
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);

  const total = ghid.pasi.length;
  const nrBifate = ghid.pasi.filter((p) => bifate.includes(p.id)).length;
  const gata = total > 0 && nrBifate === total;

  return (
    <ProgresCtx.Provider value={{ bifate, comuta }}>
      <header className="k-head">
        <div className="chips">
          <span className="free">Gratuit</span>
          <span>{ghid.durata}</span>
          <span>{ghid.nivel[0].toUpperCase() + ghid.nivel.slice(1)}</span>
          <span>{total} pași</span>
        </div>
        <h1>{ghid.titlu}</h1>
        <p className="lead">{ghid.descriere}</p>
        <p className="upd">Andrei · Build with AC · Actualizat la {actualizat}</p>
        <CercProgres bifate={nrBifate} total={total} />
        <nav className="k-toc" aria-label="Cuprins">
          <div className="eb">Cuprins</div>
          <ol>
            {ghid.pasi.map((p, i) => (
              <li key={p.id}>
                <a href={`#${p.id}`} className={bifate.includes(p.id) ? "done" : undefined}><b>{String(i + 1).padStart(2, "0")}</b>{p.titlu}</a>
              </li>
            ))}
          </ol>
        </nav>
        {ghid.pdf && <a className="pdf-top" href="#pdf" data-fara-tipar><i aria-hidden>⬇</i>Primește ghidul complet în PDF</a>}
      </header>
      <div className={`sbar${bara ? " on" : ""}`} aria-hidden={!bara} data-fara-tipar>
        <span>{gata ? "Ghid terminat ✓" : `${nrBifate} din ${total} pași`}</span>
        <div className="segs">
          {ghid.pasi.map((p) => <a key={p.id} href={`#${p.id}`} tabIndex={bara ? 0 : -1} aria-label={p.titlu} className={bifate.includes(p.id) ? "d" : undefined} />)}
        </div>
      </div>
      <div className="k-list">{children}</div>
      {gata && (
        <div className="yay" role="status" data-fara-tipar>
          <div><b>Gata, ai terminat ghidul! 🎉</b><span>Trimite-mi pe Instagram ce ai construit, îl pot arăta într-un clip.</span></div>
        </div>
      )}
      {dupa}
    </ProgresCtx.Provider>
  );
}
