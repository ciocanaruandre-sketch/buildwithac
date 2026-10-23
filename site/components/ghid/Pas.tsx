"use client";

import { useProgres } from "./Caiet";

/** O foaie de caiet. `id` și `n` le pune pagina înainte de compilarea MDX (pas-1, pas-2…). */
export function Pas({ id, n, titlu, children }: { id: string; n: string; titlu: string; children: React.ReactNode }) {
  const { bifate, comuta } = useProgres();
  const facut = bifate.includes(id);
  return (
    <section className={`k-sheet${facut ? " done" : ""}`} id={id} aria-labelledby={`${id}-titlu`}>
      <div className="tape" />
      <div className="hand mark" aria-hidden>făcut!</div>
      <div className="k-top">
        <button type="button" className="k-box" aria-pressed={facut} aria-label={facut ? `Debifează pasul ${n}` : `Bifează pasul ${n}`} onClick={() => comuta(id)}>
          <svg viewBox="0 0 46 46" aria-hidden>
            <path d="M5 7 C 14 5, 30 4, 41 6 C 42 16, 41 30, 40 40 C 28 41, 16 41, 6 40 C 5 29, 4 17, 5 7 Z" fill="none" stroke="#1b0f0a" strokeWidth="2.4" strokeLinecap="round" />
            <path className="ck" d="M11 23 L 20 33 L 40 4" fill="none" stroke="#e53222" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="num">pasul {n}{n === "1" && <> · <span>bifează pătratul când termini ←</span></>}</div>
          <h2 id={`${id}-titlu`}>{titlu}</h2>
        </div>
      </div>
      <div className="body">{children}</div>
      <button type="button" className="doneb" onClick={() => comuta(id)}>{facut ? "Bifat ✓ · anulează" : "Am făcut pasul ✓"}</button>
    </section>
  );
}
